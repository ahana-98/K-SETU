// K-SETU ML prototype inference layer.
// IMPORTANT: This is a clearly-labeled PROTOTYPE fallback (rule-based + deterministic
// heuristics). It is NOT a trained deep-learning model. The architecture is designed
// so MobileNetV3/OpenCV (classification), XGBoost (valuation) and Isolation Forest
// (anomaly detection) can be swapped in later behind the same function signatures.

export const CATEGORIES = [
  { key: "CRT", iconKey: "crt" },
  { key: "LCD/LED Panels", iconKey: "lcd" },
  { key: "PCB", iconKey: "pcb" },
  { key: "Cables", iconKey: "cable" },
  { key: "Batteries", iconKey: "battery" },
  { key: "Motors", iconKey: "motor" },
  { key: "Magnet-bearing Assemblies", iconKey: "magnet" },
  { key: "Mixed Plastics", iconKey: "plastic" },
  { key: "Copper", iconKey: "copper" },
  { key: "Aluminium", iconKey: "aluminium" },
  { key: "Other E-Waste", iconKey: "other" },
] as const;

export const METAL_CONSERVATION_RULES: Record<
  string,
  { metal: string; fraction: number }[]
> = {
  CRT: [
    { metal: "Copper", fraction: 0.04 },
    { metal: "Aluminium", fraction: 0.02 },
  ],
  "LCD/LED Panels": [
    { metal: "Aluminium", fraction: 0.08 },
    { metal: "Copper", fraction: 0.01 },
  ],
  PCB: [
    { metal: "Copper", fraction: 0.15 },
    { metal: "Aluminium", fraction: 0.03 },
  ],
  Cables: [
    { metal: "Copper", fraction: 0.55 },
    { metal: "Aluminium", fraction: 0.05 },
  ],
  Batteries: [
    { metal: "Copper", fraction: 0.08 },
    { metal: "Aluminium", fraction: 0.05 },
  ],
  Motors: [
    { metal: "Copper", fraction: 0.12 },
    { metal: "Aluminium", fraction: 0.10 },
  ],
  "Magnet-bearing Assemblies": [
    { metal: "Copper", fraction: 0.08 },
    { metal: "Aluminium", fraction: 0.12 },
  ],
  "Mixed Plastics": [],
  Copper: [
    { metal: "Copper", fraction: 0.90 },
  ],
  Aluminium: [
    { metal: "Aluminium", fraction: 0.90 },
  ],
  "Other E-Waste": [
    { metal: "Copper", fraction: 0.03 },
    { metal: "Aluminium", fraction: 0.03 },
  ],
};

export function estimateMetalConservation(
  category: string,
  weightKg: number
) {
  const rules = METAL_CONSERVATION_RULES[category] ?? [];

  return rules.map((rule) => ({
    metal: rule.metal,
    estimatedKg: Number((weightKg * rule.fraction).toFixed(3)),
    recoveredKg: 0,
    recoveryRate: 0,
    source: "prototype-estimate",
  }));
}
export const CONDITIONS = ["good", "used", "damaged", "mixed", "unknown"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_FACTOR: Record<string, number> = {
  good: 1.0,
  used: 0.85,
  damaged: 0.6,
  mixed: 0.75,
  unknown: 0.7,
};

const KEYWORDS: Record<string, string[]> = {
  CRT: ["crt", "tube", "monitor"],
  "LCD/LED Panels": ["lcd", "led", "panel", "screen", "tv", "display"],
  PCB: ["pcb", "board", "circuit", "motherboard"],
  Cables: ["cable", "wire", "cord"],
  Batteries: ["battery", "cell", "lion", "lead"],
  Motors: ["motor", "compressor", "fan"],
  "Magnet-bearing Assemblies": ["magnet", "speaker", "assembly"],
  "Mixed Plastics": ["plastic", "abs", "casing", "body"],
  Copper: ["copper", "coil", "transformer"],
  Aluminium: ["aluminium", "aluminum", "heatsink", "frame"],
  "Other E-Waste": ["other", "misc", "ewaste"],
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type ClassificationResult = {
  engine: "prototype-heuristic";
  category: string;
  confidence: number;
  alternatives: { category: string; confidence: number }[];
  note: string;
};

// Prototype classifier: deterministic heuristic. Uses filename keywords when present,
// otherwise a stable hash of the image payload so the same photo gives the same result.
export function classifyMaterial(input: {
  fileName?: string;
  imageSignature?: string;
  hint?: string;
}): ClassificationResult {
  const name = (input.fileName || "").toLowerCase().trim();

  // Prefer a matching filename keyword.
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((word) => name.includes(word))) {
      return {
        engine: "prototype-heuristic",
        category,
        confidence: 0.85,
        alternatives: [],
        note: "Prototype keyword-based classification. Please verify the material manually.",
      };
    }
  }

  // Use a valid manually selected category if available.
  if (input.hint && KEYWORDS[input.hint]) {
    return {
      engine: "prototype-heuristic",
      category: input.hint,
      confidence: 0.9,
      alternatives: [],
      note: "Material selected manually. Please verify before submitting.",
    };
  }

  // Do not guess a category from the image hash.
  return {
    engine: "prototype-heuristic",
    category: "Other E-Waste",
    confidence: 0.5,
    alternatives: [],
    note: "No reliable keyword match. Please select the material category manually.",
  };
}
export function detectCategoryAnomaly(params: {
  selectedCategory: string;
  predictedCategory: string;
  confidence: number;
}): { status: "normal" | "flag"; message: string } {
  const selected = params.selectedCategory.trim().toLowerCase();
  const predicted = params.predictedCategory.trim().toLowerCase();

  if (!selected || !predicted) {
    return {
      status: "flag",
      message: "Category information is incomplete. Manual review is recommended.",
    };
  }

  if (selected === predicted) {
    return {
      status: "normal",
      message: "Predicted material category matches the selected category.",
    };
  }

  return {
    status: "flag",
    message:
      `Category mismatch detected: selected "${params.selectedCategory}" but prototype classifier predicted "${params.predictedCategory}" with ${Math.round(params.confidence * 100)}% confidence. Manual review is recommended.`,
  };
}

// Prototype valuation: linear model rate × weight × condition factor.
// Swap-in point for an XGBoost regressor trained on prices.csv + transactions.csv.
export function estimateValue(params: {
  ratePerKg: number;
  weightKg: number;
  condition: string;
}): { estimatedValue: number; breakdown: { ratePerKg: number; weightKg: number; conditionFactor: number } } {
  const factor = CONDITION_FACTOR[params.condition] ?? 0.7;
  const estimatedValue = Math.max(0, Math.round(params.ratePerKg * params.weightKg * factor));
  return {
    estimatedValue,
    breakdown: { ratePerKg: params.ratePerKg, weightKg: params.weightKg, conditionFactor: factor },
  };
}

export type RecyclerCandidate = {
  recyclerUserId: number;
  name: string;
  facilityLocation: string;
  serviceArea: string;
  authorizationStatus: string;
  contact: string;
  pickupAvailable: boolean;
  offeredRate: number;
  materialsAccepted: string[];
  score: number;
  reasons: string[];
};

// Prototype recommendation: weighted rule ranking.
// Swap-in point for a learned-to-rank model; location/ranking logic retained.
export function rankRecyclers(
  recyclers: Omit<RecyclerCandidate, "score" | "reasons">[],
  ctx: { category: string; marketRate: number; location: string }
): RecyclerCandidate[] {
  return recyclers
    .map((r) => {
      let score = 0;
      const reasons: string[] = [];
      if (r.materialsAccepted.includes(ctx.category)) {
        score += 50;
        reasons.push("Accepts material");
      } else {
        score -= 40;
      }
      if (r.authorizationStatus === "demo_authorized") {
        score += 15;
        reasons.push("Authorized (demo)");
      }
      if (r.pickupAvailable) {
        score += 10;
        reasons.push("Pickup available");
      }
      if (r.offeredRate >= ctx.marketRate * 0.95) {
        score += 20;
        reasons.push("Fair rate");
      } else if (r.offeredRate >= ctx.marketRate * 0.8) {
        score += 10;
      }
   const normalizedLocation = ctx.location.trim().toLowerCase();
const normalizedServiceArea = r.serviceArea.trim().toLowerCase();
const normalizedFacilityLocation = r.facilityLocation.trim().toLowerCase();

const locationMatches =
  normalizedLocation === normalizedServiceArea ||
  normalizedLocation === normalizedFacilityLocation ||
  (normalizedLocation === "new town" &&
    (normalizedServiceArea === "kolkata" ||
      normalizedFacilityLocation === "kolkata"));

if (locationMatches) {
        score += 30;
        reasons.push("Near collection point");
      }
      return { ...r, score: Math.max(0, score), reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Prototype anomaly detection: range-comparison rule.
// Swap-in point for an Isolation Forest over historical price + transaction features.
export function detectAnomaly(params: {
  quotedRate: number;
  minRate: number;
  maxRate: number;
}): { status: "normal" | "flag"; message: string } {
  const low = params.minRate * 0.7;
  const high = params.maxRate * 1.3;
  if (params.quotedRate < low || params.quotedRate > high) {
    return {
      status: "flag",
      message:
        "Price appears significantly outside the recent local range. This is an indicative prototype check, not an accusation.",
    };
  }
  return { status: "normal", message: "Within expected local market range." };
}

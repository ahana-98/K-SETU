"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Btn,
  Card,
  DemoTag,
  Field,
  Icon,
  Spinner,
  inputCls,
  useToast,
} from "@/components/ui";
import { useLang, formatINR } from "@/lib/i18n";
import { api } from "@/components/ui";
import { CATEGORY_ICONS } from "@/components/ui";
import { pushQueue } from "@/lib/offline";
import { useOnline } from "@/lib/offline";
import LotLocationPicker from "@/components/LotLocationPicker";

const CATEGORIES = [
  "CRT",
  "LCD/LED Panels",
  "PCB",
  "Cables",
  "Batteries",
  "Motors",
  "Magnet-bearing Assemblies",
  "Mixed Plastics",
  "Copper",
  "Aluminium",
  "Other E-Waste",
];

const CONDITIONS = ["good", "used", "damaged", "mixed", "unknown"];

const LOCATIONS = ["Pune", "Mumbai", "Nashik", "Nagpur", "Thane"];

export default function SellPage() {
  const { t } = useLang();
  const router = useRouter();
  const { push } = useToast();
  const online = useOnline();

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("");
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState("used");
  const [location, setLocation] = useState("Pune");
  const [gps, setGps] = useState<string | null>(null);

  const [cls, setCls] = useState<{
    category: string;
    confidence: number;
    alternatives: { category: string; confidence: number }[];
  } | null>(null);

  const [estimate, setEstimate] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  /*
   * Stop the laptop camera.
   */
  function stopCamera() {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }

  /*
   * Make sure the camera is stopped if the user
   * leaves the page.
   */
  useEffect(() => {
    return () => {
      const stream = streamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /*
   * Open the laptop's built-in camera.
   */
  async function openCamera() {
    setCameraError(null);
    setErr(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is not supported by this browser. Please use Google Chrome."
      );
      setCameraOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      /*
       * Wait until the modal/video element exists.
       */
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current
            .play()
            .catch(() => {
              // Browser may require the video element to start manually.
            });
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);

      let message =
        "Could not open the camera. Please check your camera permission.";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          message =
            "Camera permission was denied. Please allow camera access in Chrome and try again.";
        } else if (error.name === "NotFoundError") {
          message =
            "No camera was found. Please connect or enable a camera.";
        } else if (error.name === "NotReadableError") {
          message =
            "The camera is already being used by another application.";
        }
      }

      setCameraError(message);
      setCameraOpen(true);
    }
  }

  /*
   * Capture the current webcam frame.
   */
  async function capturePhoto() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is not ready yet. Please wait a moment.");
      return;
    }

    setCapturing(true);
    setCameraError(null);

    try {
      const canvas = document.createElement("canvas");

      const max = 720;
      const scale = Math.min(
        1,
        max / Math.max(video.videoWidth, video.videoHeight)
      );

      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not access image canvas");
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const capturedImage = canvas.toDataURL("image/jpeg", 0.72);

      setImage(capturedImage);
      setFileName(`camera-${Date.now()}.jpg`);
      setCls(null);
      setEstimate(null);

      stopCamera();
    } catch (error) {
      console.error("Capture error:", error);
      setCameraError("Could not capture the photo. Please try again.");
    } finally {
      setCapturing(false);
    }
  }

  /*
   * Existing upload/compression functionality.
   */
  function compress(file: File) {
    setFileName(file.name);
    setCls(null);
    setEstimate(null);

    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();

      img.onload = () => {
        const max = 720;

        const scale = Math.min(
          1,
          max / Math.max(img.width, img.height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        canvas
          .getContext("2d")!
          .drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

        setImage(
          canvas.toDataURL("image/jpeg", 0.72)
        );
      };

      img.onerror = () => {
        setImage(reader.result as string);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  async function runClassify() {
    if (!image && !fileName) {
      setErr("Take or upload a material photo first.");
      return;
    }

    setBusy("classify");
    setErr(null);

    try {
      const sig = image
        ? `${image.length}:${image.slice(30, 80)}`
        : fileName;

      const res = await api<any>("/ml/classify", {
        method: "POST",
        body: JSON.stringify({
          fileName,
          imageSignature: sig,
          hint: category || undefined,
        }),
      });

      setCls(res);

      if (!category) {
        setCategory(res.category);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function runEstimate() {
    if (!(Number(weight) > 0) || !category) {
      setErr("Enter material and weight first");
      return;
    }

    setBusy("estimate");
    setErr(null);

    try {
      const res = await api<any>("/ml/estimate", {
        method: "POST",
        body: JSON.stringify({
          category,
          weightKg: Number(weight),
          condition,
          location,
        }),
      });

      setEstimate(res.estimatedValue);
    } catch {
      // Offline fallback estimate using cached-ish base rates.
      const base: Record<string, number> = {
        PCB: 180,
        Cables: 120,
        Copper: 420,
        Aluminium: 110,
        Batteries: 55,
        CRT: 18,
        "LCD/LED Panels": 45,
        Motors: 70,
        "Magnet-bearing Assemblies": 90,
        "Mixed Plastics": 12,
        "Other E-Waste": 25,
      };

      const f: Record<string, number> = {
        good: 1,
        used: 0.85,
        damaged: 0.6,
        mixed: 0.75,
        unknown: 0.7,
      };

      setEstimate(
        Math.round(
          (base[category] ?? 50) *
            Number(weight) *
            (f[condition] ?? 0.7)
        )
      );
    } finally {
      setBusy(null);
    }
  }

function useGps() {
  setBusy("gps");
  setErr(null);

  if (!navigator.geolocation) {
    setBusy(null);
    push("GPS is not supported by this browser.", "warn");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude, accuracy } = position.coords;

        const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        setGps(coordinates);

        const response = await fetch(
          `/api/geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
        );

        const data = await response.json();

        if (!response.ok || !data.city) {
          throw new Error(
            data.error || "Could not determine your city."
          );
        }

        setLocation(data.city);

        push(
          `GPS detected: ${data.city} (${coordinates}, accuracy ±${Math.round(
            accuracy
          )} m)`,
          "ok"
        );
      } catch (error) {
        console.error("GPS city detection error:", error);

        push(
          "GPS coordinates detected, but the city could not be determined.",
          "warn"
        );
      } finally {
        setBusy(null);
      }
    },
    (error) => {
      setBusy(null);

      let message = "Unable to detect your GPS location.";

      if (error.code === error.PERMISSION_DENIED) {
        message =
          "GPS permission was denied. Please allow location access in Chrome.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message =
          "GPS location is currently unavailable. Please try again.";
      } else if (error.code === error.TIMEOUT) {
        message =
          "GPS request timed out. Please try again.";
      }

      push(message, "warn");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
}
async function handleMapLocation(coordinates: string) {
  setGps(coordinates);
  setErr(null);

  const [latitude, longitude] = coordinates.split(",");

  try {
    const response = await fetch(
      `/api/geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
    );
    const data = await response.json();

    if (response.ok && data.city) {
      setLocation(data.city);
      push(`Collection location selected: ${data.city}`, "ok");
    } else {
      push("Coordinates selected. Please confirm the city manually.", "warn");
    }
  } catch {
    push("Coordinates selected. Please confirm the city manually.", "warn");
  }
}

  async function createLot() {
    setErr(null);

    const w = Number(weight);

    if (!category) {
      return setErr(t("sell.material"));
    }

    if (!(w > 0)) {
      return setErr("Weight must be a positive number");
    }

    setBusy("create");

    const payload = {
  category,
  weightKg: w,
  condition,
  collectionLocation: location,
  latitude: gps
    ? Number(gps.split(",")[0])
    : undefined,
  longitude: gps
    ? Number(gps.split(",")[1])
    : undefined,
  imageData: image ?? undefined,
  description: gps ? `GPS ${gps}` : undefined,
  estimatedValue: estimate ?? undefined,
};

    try {
      if (!online) {
        throw new Error("offline");
      }

      const lot = await api<any>("/lots", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      push(`${t("sell.created")}: ${lot.lotCode}`, "ok");

      router.push("/collector/lots");
    } catch {
      pushQueue(payload);

      push(
        online
          ? t("sell.created")
          : "Saved offline — will sync automatically",
        "ok"
      );

      router.push("/collector/lots");
    } finally {
      setBusy(null);
    }
  }

  const step = (n: number, label: string) => (
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-extrabold text-white">
        {n}
      </span>

      <span className="text-sm font-extrabold text-forest">
        {label}
      </span>
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-forest">
            {t("sell.title")}
          </h1>

          <DemoTag>PROTOTYPE</DemoTag>
        </div>

        {/* STEP 1 — PHOTO */}
        <Card className="p-4">
          {step(1, t("sell.photo"))}

          <div className="flex items-center gap-3">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="material"
                className="h-24 w-24 rounded-lg border border-[#dcebe0] object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-[#cfe0d4] bg-mint text-sage">
                <Icon name="camera" size={30} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* REAL CAMERA BUTTON */}
              <Btn
                size="sm"
                onClick={openCamera}
                disabled={cameraOpen}
              >
                <Icon name="camera" size={16} />
                {t("sell.takePhoto")}
              </Btn>

              {/* EXISTING UPLOAD BUTTON */}
              <Btn
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="upload" size={16} />
                {t("sell.upload")}
              </Btn>
            </div>

            {/* Upload only — no longer used for Take Photo */}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  compress(file);
                }
              }}
            />
          </div>

          <Btn
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={runClassify}
            disabled={busy === "classify" || !image}
          >
            {busy === "classify" ? (
              <Spinner />
            ) : (
              <Icon name="scan" size={16} />
            )}

            {t("sell.classify")}
          </Btn>

          {cls && (
            <div className="rise mt-3 rounded-lg bg-mint p-3">
              <p className="text-sm font-extrabold text-forest">
                {cls.category}
              </p>

              <p className="text-xs text-sage">
                {t("sell.confidence")}:{" "}
                <span className="font-bold text-pine">
                  {Math.round(cls.confidence * 100)}%
                </span>
              </p>

              <p className="mt-1 text-[11px] text-sage">
                {t("sell.alternatives")}:{" "}
                {cls.alternatives
                  .map(
                    (a) =>
                      `${a.category} (${Math.round(
                        a.confidence * 100
                      )}%)`
                  )
                  .join(", ")}
              </p>

              <p className="mt-1 text-[10px] text-sage">
                <DemoTag>ML PROTOTYPE</DemoTag>{" "}
                Heuristic fallback — not a trained model.
              </p>
            </div>
          )}
        </Card>

        {/* STEP 2 — MATERIAL */}
        <Card className="p-4">
          {step(2, t("sell.material"))}

          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-1.5 py-2.5 text-center transition ${
                  category === c
                    ? "border-pine bg-mint text-forest"
                    : "border-transparent bg-white text-sage"
                }`}
              >
                <Icon
                  name={CATEGORY_ICONS[c]}
                  size={24}
                  className={
                    category === c ? "text-pine" : ""
                  }
                />

                <span className="text-[10px] font-bold leading-tight">
                  {c}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* STEP 3 — WEIGHT + CONDITION */}
        <Card className="space-y-3 p-4">
          {step(
            3,
            `${t("sell.weight")} • ${t("sell.condition")}`
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("sell.weight")}>
              <input
                className={inputCls}
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value)
                }
                placeholder="8"
              />
            </Field>

            <Field label={t("sell.condition")}>
              <select
                className={inputCls}
                value={condition}
onChange={(e) => {
  setLocation(e.target.value);
}}              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {t(`sell.cond.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        {/* STEP 4 — LOCATION */}
        <Card className="space-y-3 p-4">
          {step(4, t("sell.location"))}

          <div className="flex gap-2">
           <select
  className={inputCls}
  value={location}
  onChange={(e) => setLocation(e.target.value)}
>
  {gps && !LOCATIONS.includes(location) && (
    <option value={location}>{location}</option>
  )}

  {LOCATIONS.map((l) => (
    <option key={l} value={l}>
      {l}
    </option>
  ))}
            </select>

            <Btn
              variant="outline"
              size="sm"
              onClick={useGps}
              disabled={busy === "gps"}
              className="shrink-0"
            >
              {busy === "gps" ? (
                <Spinner />
              ) : (
                <Icon name="pin" size={16} />
              )}

              {t("sell.useGps")}
            </Btn>
          </div>
{gps && (
  <div className="rounded-lg bg-mint/40 px-3 py-2 text-[11px] text-sage">
    <p>
      📍 Location detected: <strong>{location}</strong>
    </p>
    <p className="mt-0.5">
      GPS coordinates captured: {gps}
    </p>
  </div>
)}
<LotLocationPicker
  initialLocation={location}
  selectedGps={gps}
  onSelect={handleMapLocation}
/>
        </Card>

        {/* STEP 5 — ESTIMATE */}
        <Card tint className="p-4">
          {step(5, t("sell.estimate"))}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-forest">
                {estimate !== null
                  ? formatINR(estimate)
                  : "—"}
              </p>

              <p className="text-[11px] text-sage">
                {t("sell.estimateNote")}
              </p>
            </div>

            <Btn
              variant="secondary"
              size="sm"
              onClick={runEstimate}
              disabled={busy === "estimate"}
            >
              {busy === "estimate" ? (
                <Spinner />
              ) : (
                <Icon name="scale" size={16} />
              )}

              Estimate
            </Btn>
          </div>
        </Card>

        {err && (
          <div className="rounded-lg border border-danger/30 bg-dangerbg px-3 py-2 text-sm font-semibold text-danger">
            <Icon
              name="alert"
              size={14}
              className="mr-1 inline"
            />
            {err}
          </div>
        )}

        <Btn
          full
          size="lg"
          onClick={createLot}
          disabled={busy === "create"}
        >
          {busy === "create" ? (
            <Spinner />
          ) : (
            <Icon name="plus" size={18} />
          )}

          {t("sell.create")}
        </Btn>
      </div>

      {/* ================================
          CAMERA MODAL
          ================================ */}
      {cameraOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Camera header */}
            <div className="flex items-center justify-between bg-forest px-4 py-3 text-white">
              <div>~
                <p className="font-extrabold">
                  Take Material Photo
                </p>

                <p className="text-xs text-white/70">
                  Point the camera at the e-waste
                </p>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="rounded-full bg-white/10 px-3 py-2 text-lg"
                aria-label="Close camera"
              >
                ✕
              </button>
            </div>

            {/* Camera preview */}
            <div className="relative bg-black">
              {cameraError ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                  <Icon
                    name="camera"
                    size={42}
                    className="mb-3 text-white"
                  />

                  <p className="text-sm font-semibold text-white">
                    {cameraError}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraOpen(false);

                      window.setTimeout(() => {
                        openCamera();
                      }, 200);
                    }}
                    className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-forest"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-video w-full object-cover"
                  />

                  {/* Camera guide */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-44 w-64 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]" />
                  </div>
                </>
              )}
            </div>

            {/* Camera controls */}
            {!cameraError && (
              <div className="flex items-center justify-center gap-4 px-4 py-5">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-xl border border-[#dcebe0] px-4 py-3 text-sm font-bold text-sage"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={capturing}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-pine bg-white shadow-lg"
                  aria-label="Capture photo"
                >
                  {capturing ? (
                    <Spinner />
                  ) : (
                    <span className="h-11 w-11 rounded-full bg-pine" />
                  )}
                </button>

                <span className="w-[70px] text-[10px] font-bold text-sage">
                  {capturing
                    ? "Capturing..."
                    : "Capture"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
"use client";
// K-SETU offline-first helpers: connectivity tracking, local cache and a sync queue
// persisted in localStorage. Lots created offline are queued and pushed to /api/sync.
import { useCallback, useEffect, useState } from "react";

export type QueuedLot = {
  id: string;
  syncId: string;
  category: string;
  subcategory?: string;
  description?: string;
  imageData?: string;
  weightKg: number;
  condition: string;
  collectionLocation: string;
  estimatedValue?: number;
  queuedAt: number;
};

const QUEUE_KEY = "ksetu_sync_queue";
const CACHE_PREFIX = "ksetu_cache_";

export function useOnline() {
  // Keep the initial server and client render identical
  // to prevent React hydration errors.
  const [online, setOnline] = useState(true);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

export function getQueue(): QueuedLot[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushQueue(
  lot: Omit<QueuedLot, "id" | "syncId" | "queuedAt">
) {
  const q = getQueue();

  const syncId = crypto.randomUUID();

  q.push({
    ...lot,
    id: `local-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    syncId,
    queuedAt: Date.now(),
  });

  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  window.dispatchEvent(new Event("ksetu-queue"));
}

export function clearQueue(ids: string[]) {
  const q = getQueue().filter((x) => !ids.includes(x.id));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  window.dispatchEvent(new Event("ksetu-queue"));
}

export function useQueueCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getQueue().length);
    update();
    window.addEventListener("ksetu-queue", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("ksetu-queue", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return count;
}

export type SyncState = "synced" | "pending" | "syncing";

export function useSync(onDone?: (n: number) => void) {
  const online = useOnline();
  const count = useQueueCount();
  const [state, setState] = useState<SyncState>(count ? "pending" : "synced");

  const flush = useCallback(async () => {
    const q = getQueue();
    if (!q.length || !navigator.onLine) return;
    setState("syncing");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  lots: q.map(({ id, queuedAt, ...rest }) => rest),
}),
      });
      if (res.ok) {
        clearQueue(q.map((x) => x.id));
        setState("synced");
        onDone?.(q.length);
      } else {
        setState("pending");
      }
    } catch {
      setState("pending");
    }
  }, [onDone]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setState(count ? (online ? "pending" : "pending") : "synced");
    if (online && count) flush();
  }, [online, count, flush]);

  useEffect(() => {
    const t = setInterval(() => {
      if (navigator.onLine && getQueue().length) flush();
    }, 20000);
    return () => clearInterval(t);
  }, [flush]);

  return { online, count, state, flush };
}

export function cacheSet(key: string, value: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {}
}

export function cacheGet<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 24): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.at > maxAgeMs) return null;
    return parsed.value as T;
  } catch {
    return null;
  }
}

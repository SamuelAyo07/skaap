/**
 * Background sync queue.
 *
 * Queues mutations (scan history inserts, store check-ins, feedback)
 * to localStorage when the device is offline or the request fails, then
 * automatically flushes the queue when connectivity returns.
 *
 * Uses the native `SyncManager` when available (Android Chrome) to wake
 * the service worker for true OS-level background sync, and always
 * falls back to a `window.online` listener + visibility-change retry
 * for iOS Safari / Capacitor WebView where SyncManager is missing.
 */

import { supabase } from "@/integrations/supabase/client";

type QueuedJob = {
  id: string;
  kind: "scan" | "store_check" | "feedback" | "custom";
  table?: string;
  payload: Record<string, unknown>;
  endpoint?: string; // for edge-function calls
  attempts: number;
  queuedAt: number;
};

const KEY = "skaap_bgsync_queue_v1";
const MAX_ATTEMPTS = 6;
const FLUSH_DEBOUNCE_MS = 400;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
const listeners = new Set<(count: number) => void>();

function readQueue(): QueuedJob[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(jobs: QueuedJob[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(jobs));
    listeners.forEach((fn) => fn(jobs.length));
  } catch {
    /* quota — drop oldest */
    if (jobs.length > 1) writeQueue(jobs.slice(-50));
  }
}

export function pendingCount(): number {
  return readQueue().length;
}

export function onQueueChange(cb: (count: number) => void): () => void {
  listeners.add(cb);
  cb(readQueue().length);
  return () => listeners.delete(cb);
}

/** Queue a Supabase table insert that should survive offline. */
export function enqueueInsert(
  table: string,
  payload: Record<string, unknown>,
  kind: QueuedJob["kind"] = "custom",
) {
  const job: QueuedJob = {
    id: crypto.randomUUID(),
    kind,
    table,
    payload,
    attempts: 0,
    queuedAt: Date.now(),
  };
  const q = readQueue();
  q.push(job);
  writeQueue(q);
  requestSync();
}

/** Try an insert immediately; queue on failure / offline. */
export async function syncedInsert(
  table: string,
  payload: Record<string, unknown>,
  kind: QueuedJob["kind"] = "custom",
): Promise<{ ok: boolean; queued: boolean }> {
  if (!navigator.onLine) {
    enqueueInsert(table, payload, kind);
    return { ok: false, queued: true };
  }
  try {
    const { error } = await (supabase as any).from(table).insert(payload);
    if (error) throw error;
    return { ok: true, queued: false };
  } catch {
    enqueueInsert(table, payload, kind);
    return { ok: false, queued: true };
  }
}

async function runJob(job: QueuedJob): Promise<boolean> {
  try {
    if (job.table) {
      const { error } = await (supabase as any).from(job.table).insert(job.payload);
      if (error) throw error;
      return true;
    }
    if (job.endpoint) {
      const res = await fetch(job.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.payload),
      });
      return res.ok;
    }
    return true;
  } catch {
    return false;
  }
}

export async function flushQueue(): Promise<void> {
  if (isFlushing || !navigator.onLine) return;
  isFlushing = true;
  try {
    let q = readQueue();
    if (!q.length) return;
    const remaining: QueuedJob[] = [];
    for (const job of q) {
      const ok = await runJob(job);
      if (ok) continue;
      job.attempts += 1;
      if (job.attempts < MAX_ATTEMPTS) remaining.push(job);
      // else: drop after max attempts
    }
    writeQueue(remaining);
  } finally {
    isFlushing = false;
  }
}

function requestSync() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, FLUSH_DEBOUNCE_MS);

  // Ask the SW for OS-level background sync where supported.
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((reg: any) => reg.sync?.register("skaap-bgsync"))
      .catch(() => {/* ignore — fallback handles it */});
  }
}

let installed = false;
export function installBackgroundSync() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("online", () => flushQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushQueue();
  });
  // Initial flush on boot in case we crashed mid-sync.
  if (navigator.onLine) setTimeout(flushQueue, 1500);

  // Listen for SW-driven sync messages
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "skaap-bgsync-flush") flushQueue();
    });
  }
}

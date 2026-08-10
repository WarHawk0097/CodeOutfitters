"use client";

// Live Activity feed — client hook, same fetch/refresh idiom as lib/tasks/use-live-tasks.ts.
// `enabled` gates the fetch so demo mode never calls the API.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivityEvent } from "./model";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; events: ActivityEvent[] };

type ApiResult<T> = { ok: true; body: T } | { ok: false; message: string };

async function parseApi<T>(res: Response): Promise<ApiResult<T>> {
  let body: { ok?: boolean; error?: { message?: string } } & Partial<T>;
  try {
    body = await res.json();
  } catch {
    return { ok: false, message: "The server sent an unreadable response." };
  }
  if (!res.ok || body?.ok !== true) {
    return { ok: false, message: body?.error?.message ?? "That request failed." };
  }
  return { ok: true, body: body as T };
}

async function fetchActivity(limit: number): Promise<LoadState> {
  const res = await fetch(`/api/dashboard/activity?limit=${limit}`, { method: "GET" });
  const result = await parseApi<{ events: ActivityEvent[] }>(res);
  if (!result.ok) return { status: "error", message: result.message };
  return { status: "ready", events: result.body.events };
}

export type UseLiveActivityResult = {
  status: "loading" | "error" | "ready";
  events: ActivityEvent[];
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLiveActivity(enabled: boolean, limit = 50): UseLiveActivityResult {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const next = await fetchActivity(limit);
    if (mounted.current) setLoad(next);
  }, [enabled, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status: load.status,
    events: load.status === "ready" ? load.events : [],
    error: load.status === "error" ? load.message : null,
    refresh,
  };
}

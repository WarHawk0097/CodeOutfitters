"use client";
// Which form a route renders at.
//
// Some canonical screens change STRUCTURE, not just style, between breakpoints — the
// Pipeline board shows four stage columns at desktop, two at tablet and one stage at a time
// at mobile. That cannot be expressed by hiding nodes with CSS without rendering the board
// three times, so the breakpoint is read as data here.
//
// The two thresholds are Tailwind's md (768) and xl (1280), the same ones the accepted shell
// switches the sidebar on, so a route can never disagree with its own navigation.
import { useSyncExternalStore } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

function subscribe(callback: () => void): () => void {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getBreakpoint(): Breakpoint {
  if (window.innerWidth < 768) return "mobile";
  return window.innerWidth >= 1280 ? "desktop" : "tablet";
}

// The server has no viewport. Routes render their loading state on the server (see
// useDemoQuery), so this snapshot is never what the user sees — it only has to be stable.
const serverBreakpoint = (): Breakpoint => "desktop";

export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, getBreakpoint, serverBreakpoint);
}

// Workflow-audit popup suppression + eligibility rules (spec §7). Pure logic:
// reads/writes ONLY the popup's own localStorage key (never the cookie-consent
// key) and stores ZERO inquiry details — just a dismissed timestamp, a
// submitted flag, the last auto-display timestamp, and the popup version.
//
// The component owns the trigger listeners (timer / scroll / exit-intent); this
// module owns the "is the popup allowed to auto-show right now?" decision so it
// is unit-testable without a DOM.
const STORAGE_KEY = "co_workflow_audit_popup";

// Bumping this re-enables the popup for everyone who previously dismissed it
// (spec §7 "popup version" in stored state). Change only when the offer/copy
// materially changes.
export const POPUP_VERSION = 1;

// Once per 7 days after a dismissal (spec §7 suppression).
export const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Path prefixes where the popup must never auto-show (spec §7): Contact (the
// full form already lives there), the dashboard app, and sign-in.
const EXCLUDED_PREFIXES = ["/contact", "/dashboard", "/sign-in", "/signin", "/login"];

export type PopupStoredState = {
  version: number;
  dismissedAt?: number;
  submitted?: boolean;
  lastAutoDisplayAt?: number;
};

function safeParse(raw: string | null): PopupStoredState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PopupStoredState;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readPopupState(): PopupStoredState {
  if (typeof window === "undefined") return { version: POPUP_VERSION };
  try {
    const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    // A version mismatch resets state (the offer changed), matching §7's
    // "popup version" gate.
    if (!stored || stored.version !== POPUP_VERSION) {
      return { version: POPUP_VERSION };
    }
    return stored;
  } catch {
    return { version: POPUP_VERSION };
  }
}

function write(next: PopupStoredState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage blocked -> the popup simply loses persistence this session
  }
}

export function markDismissed(now: number): void {
  write({ ...readPopupState(), dismissedAt: now });
}

export function markSubmitted(): void {
  write({ ...readPopupState(), submitted: true });
}

export function markAutoDisplayed(now: number): void {
  write({ ...readPopupState(), lastAutoDisplayAt: now });
}

export function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export type EligibilityInput = {
  pathname: string;
  now: number;
  // Runtime conditions the component supplies (spec §7): another modal open,
  // a submission in flight, or an authenticated dashboard user.
  anotherModalOpen?: boolean;
  submitting?: boolean;
  isAuthenticatedDashboardUser?: boolean;
};

// The single "may the popup auto-show now?" gate (spec §7). Returns false for
// every suppression condition; manual CTA opens bypass this entirely.
export function canAutoShowPopup(input: EligibilityInput): boolean {
  const { pathname, now } = input;
  if (input.anotherModalOpen || input.submitting) return false;
  if (input.isAuthenticatedDashboardUser) return false;
  if (isExcludedPath(pathname)) return false;

  const state = readPopupState();
  if (state.submitted) return false; // never again after a successful submit
  if (
    state.dismissedAt !== undefined &&
    now - state.dismissedAt < DISMISS_COOLDOWN_MS
  ) {
    return false; // inside the 7-day cooldown
  }
  return true;
}

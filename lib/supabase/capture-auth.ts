import "server-only";
import { resolveMeetingCaptureToken } from "@/lib/supabase/meeting-capture-token";
import { resolveExtensionSession } from "@/lib/extension-auth/server";

// Bearer-token auth for the Meeting Capture ingestion API.
//
// Capture routes accept only the dedicated, signed meeting-capture credential. The
// normal Supabase session never leaves the authenticated CodeOutfitters page.

export type CaptureAuthContext = {
  userId: string;
  workspaceId: string;
  role: "capture";
};

export async function resolveCaptureAuth(bearerToken: string): Promise<CaptureAuthContext | null> {
  try {
    const extension = await resolveExtensionSession(bearerToken);
    if (extension) return { ...extension, role: "capture" };
  } catch {
    // Migration-only fallback; the extension never uses the legacy token path.
  }
  const context = resolveMeetingCaptureToken(bearerToken);
  return context ? { ...context, role: "capture" } : null;
}

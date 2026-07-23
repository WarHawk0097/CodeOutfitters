import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolated Command Center frontend. Independent of root public app's
  // next.config — see work/PUBLIC-FRONTEND-PROTECTION-MAP.md.
  // NOTE: Next.js emits a workspace-root inference warning locally because both
  // this workspace's pnpm-lock.yaml and the root marketing app's package-lock.json
  // are visible above this directory. This is a local-disk artifact only — on Vercel
  // just the command-center tree is uploaded, so the parent lockfile is absent and
  // root inference is unambiguous. Verified by a clean build; does not affect output.
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolated Command Center frontend. Independent of root public app's
  // next.config — see work/PUBLIC-FRONTEND-PROTECTION-MAP.md.
  // NOTE: Next.js emits a workspace-root inference warning at build time
  // because both this workspace's pnpm-workspace.yaml and the root app's
  // package-lock.json are visible above this directory. This is expected
  // given the deliberate dual-lockfile isolation (ADR-COMMAND-CENTER-LOCATION.md)
  // and does not affect build correctness — verified by a clean build.
};

export default nextConfig;

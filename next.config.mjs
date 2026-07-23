// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite (local inquiry repo) ships a citext.tar.gz extension loaded at runtime
  // via a filesystem path. Bundling rewrites it to a /_next static URL that
  // PGlite's Node loader can't read (ERR_INVALID_ARG_TYPE). Keep it external so
  // the package is required from node_modules and its asset paths stay real.
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
  },
}

export default nextConfig

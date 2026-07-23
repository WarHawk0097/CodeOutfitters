// Local inquiry-platform launcher (Work Order E). Reads local Supabase
// credentials from `supabase status -o env` IN MEMORY, refuses anything that is
// not a 127.0.0.1/localhost stack, injects the inquiry storage/scanner config,
// and spawns the Next dev server. It NEVER writes credentials to disk and never
// logs them — the `.env*` restriction is honored, not bypassed.
//
// Usage: node scripts/start-local-inquiry-platform.mjs
import { execFileSync, spawn } from 'node:child_process'

function readLocalSupabaseEnv() {
  let raw
  try {
    raw = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' })
  } catch {
    console.error('[launcher] Local Supabase is not available. Run `npm run supabase:start` first.')
    process.exit(1)
  }
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

function assertLocal(url, label) {
  let host
  try {
    host = new URL(url).hostname
  } catch {
    console.error(`[launcher] ${label} is not a valid URL.`)
    process.exit(1)
  }
  if (host !== '127.0.0.1' && host !== 'localhost') {
    console.error(`[launcher] Refusing to start: ${label} host "${host}" is not local.`)
    process.exit(1)
  }
}

const sb = readLocalSupabaseEnv()
const apiUrl = sb.API_URL
const anon = sb.ANON_KEY
const secret = sb.SECRET_KEY || sb.SERVICE_ROLE_KEY
if (!apiUrl || !anon || !secret) {
  console.error('[launcher] Local Supabase status is missing API_URL / ANON_KEY / SERVICE_ROLE_KEY.')
  process.exit(1)
}
assertLocal(apiUrl, 'Supabase API_URL')

const childEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  SUPABASE_SECRET_KEY: secret,
  INQUIRY_STORAGE_MODE: 'supabase',
  INQUIRY_STORAGE_BUCKET: 'inquiry-attachments',
  INQUIRY_FILE_SCANNER_MODE: 'clamav',
  INQUIRY_CLAMAV_HOST: process.env.INQUIRY_CLAMAV_HOST || '127.0.0.1',
  INQUIRY_CLAMAV_PORT: process.env.INQUIRY_CLAMAV_PORT || '3310',
}

console.log('[launcher] Local stack verified. Storage origin:', new URL(apiUrl).origin)
console.log('[launcher] Starting Next dev on http://localhost:3005 ...')

const child = spawn('npm', ['run', 'dev'], {
  env: childEnv,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
child.on('exit', (code) => process.exit(code ?? 0))
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))

import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// At-rest encryption for provider credentials — the answer to "how are tokens stored"
// for every adapter in lib/integrations/providers/.
//
// There is no Vault/pgsodium in this project (grepped every migration; none uses
// pgcrypto, pgsodium, or supabase_vault) and enabling one is an infrastructure decision
// this task does not have standing to make. So encryption happens here, in the Node
// process, with AES-256-GCM (authenticated — a flipped bit fails to decrypt rather than
// silently returning garbage) and a key that never enters Postgres: INTEGRATION_TOKEN_
// ENCRYPTION_KEY, read once from the environment, never logged, never hard-coded. A
// leaked database row is ciphertext an attacker with the row but not the process
// environment cannot open.
//
// What this deliberately is NOT: a KMS integration, a rotation scheme beyond the single
// `credential_version` column already on the table, or a substitute for least-privilege
// database grants — it is the minimal correct primitive those can be built on later.

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

class IntegrationCryptoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationCryptoConfigError";
  }
}

let cachedKey: Buffer | undefined;

/** Fails closed: a missing or malformed key throws rather than falling back to an
 *  unencrypted or weakly-derived one. Read lazily so a build with no key configured
 *  (nothing in Phase 2 CI needs a real key) never fails until a connect actually runs. */
function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new IntegrationCryptoConfigError(
      "INTEGRATION_TOKEN_ENCRYPTION_KEY is not configured — refusing to store a provider credential unencrypted.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new IntegrationCryptoConfigError(
      `INTEGRATION_TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length}).`,
    );
  }
  cachedKey = key;
  return key;
}

/** Test-only seam: lets a suite set a key without touching process.env / mutating global
 *  state other tests observe. Not exported from any provider-facing module. */
export function __setKeyForTests(key: Buffer | undefined): void {
  cachedKey = key;
}

/** Plaintext in, opaque `credential_ciphertext` column value out. Never logged — callers
 *  must not console.log/JSON.stringify the input on an error path either. */
export function encryptCredential(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

/** Inverse of encryptCredential. Throws on a tampered or wrong-key ciphertext — GCM's
 *  authentication tag makes that check load-bearing, not decorative. */
export function decryptCredential(ciphertext: string): string {
  const key = loadKey();
  const [version, ivB64, tagB64, dataB64] = ciphertext.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new IntegrationCryptoConfigError("Malformed credential ciphertext.");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

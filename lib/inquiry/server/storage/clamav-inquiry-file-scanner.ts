import "server-only";
import { connect, type Socket } from "node:net";
import type { InquiryFileScanner, ScanResult } from "./inquiry-file-scanner";

// Real ClamAV scanner (spec §11 / Work Order E Step 11). Talks the clamd
// INSTREAM protocol over TCP to the project-scoped ClamAV container — no host
// filesystem mount, no shelling out. Bounded by a timeout; on any transport
// failure it returns 'unavailable' (fails closed: the caller must not allow
// download unless status is 'clean').
//
// Wire protocol: send "zINSTREAM\0", then repeated <uint32be length><chunk>,
// then a zero-length terminator; clamd replies "stream: OK\0" or
// "stream: <SigName> FOUND\0".
const MAX_CHUNK = 64 * 1024;

export type ClamAvConfig = {
  host: string;
  port: number;
  timeoutMs?: number;
};

export function clamAvConfigFromEnv(): ClamAvConfig {
  const host = process.env.INQUIRY_CLAMAV_HOST;
  const port = process.env.INQUIRY_CLAMAV_PORT;
  if (!host || !port) {
    throw new Error("ClamAV scanner is not configured (missing INQUIRY_CLAMAV_HOST/PORT).");
  }
  return { host, port: Number(port), timeoutMs: 30_000 };
}

export class ClamAvInquiryFileScanner implements InquiryFileScanner {
  constructor(private readonly config: ClamAvConfig) {}

  scan(bytes: Uint8Array): Promise<ScanResult> {
    const { host, port, timeoutMs = 30_000 } = this.config;
    return new Promise<ScanResult>((resolve) => {
      let settled = false;
      const done = (r: ScanResult) => {
        if (settled) return;
        settled = true;
        try {
          socket.destroy();
        } catch {
          /* ignore */
        }
        resolve(r);
      };

      const socket: Socket = connect({ host, port });
      const chunks: Buffer[] = [];

      socket.setTimeout(timeoutMs, () => done({ status: "unavailable" }));
      socket.on("error", () => done({ status: "unavailable" }));
      socket.on("data", (d) => chunks.push(d));
      socket.on("end", () => {
        const reply = Buffer.concat(chunks).toString("utf8").replace(/\0/g, "").trim();
        if (/\bOK$/.test(reply)) return done({ status: "clean" });
        const found = reply.match(/stream:\s+(.+)\s+FOUND$/);
        if (found) return done({ status: "rejected", signature: found[1] });
        // ERROR/size-limit/anything unexpected: scan ran but failed on this object.
        return done({ status: "failed", signature: reply.slice(0, 120) || undefined });
      });

      socket.on("connect", () => {
        socket.write("zINSTREAM\0");
        for (let off = 0; off < bytes.length; off += MAX_CHUNK) {
          const slice = bytes.subarray(off, Math.min(off + MAX_CHUNK, bytes.length));
          const len = Buffer.alloc(4);
          len.writeUInt32BE(slice.length, 0);
          socket.write(len);
          socket.write(Buffer.from(slice));
        }
        const terminator = Buffer.alloc(4);
        terminator.writeUInt32BE(0, 0);
        socket.write(terminator);
      });
    });
  }
}

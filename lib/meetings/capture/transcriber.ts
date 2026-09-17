import "server-only";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";

type Pending = { resolve: (value: string) => void; reject: (reason?: unknown) => void };
let worker: ChildProcessWithoutNullStreams | null = null;
let stdoutBuffer = "";
const pending = new Map<string, Pending>();

function failWorker(error: Error) {
  worker = null;
  for (const request of pending.values()) request.reject(error);
  pending.clear();
}

function ensureWorker() {
  if (worker && !worker.killed) return worker;
  const command = process.env.CODEOUTFITTERS_PYTHON ?? "python3";
  const script = resolve(process.cwd(), "scripts/local-transcriber.py");
  // The executable and script are intentionally selected at runtime for the local-only
  // capture worker; do not ask Next to trace the entire repository as a dependency.
  worker = spawn(/* turbopackIgnore: true */ command, [script], { stdio: ["pipe", "pipe", "pipe"] });
  worker.stdout.on("data", (chunk: Buffer) => {
    stdoutBuffer += chunk.toString("utf8");
    let newline = stdoutBuffer.indexOf("\n");
    while (newline >= 0) {
      const line = stdoutBuffer.slice(0, newline).trim();
      stdoutBuffer = stdoutBuffer.slice(newline + 1);
      newline = stdoutBuffer.indexOf("\n");
      if (!line) continue;
      try {
        const response = JSON.parse(line) as { id?: string; text?: string; error?: string };
        if (typeof response.id !== "string") continue;
        const request = pending.get(response.id);
        if (!request) continue;
        pending.delete(response.id);
        if (response.error) request.reject(new Error(response.error));
        else request.resolve(response.text?.trim() ?? "");
      } catch {
        // Ignore non-JSON worker diagnostics; the worker's stderr is not exposed.
      }
    }
  });
  worker.on("error", (error) => failWorker(error));
  worker.on("close", (code) => failWorker(new Error(`local-transcriber-exited-${code ?? "unknown"}`)));
  return worker;
}

export async function transcribeAudioChunk(audio: ArrayBuffer, mimeType: string): Promise<string> {
  const child = ensureWorker();
  const id = randomUUID();
  const payload = JSON.stringify({ id, mimeType, audio: Buffer.from(audio).toString("base64") }) + "\n";
  return new Promise<string>((resolvePromise, reject) => {
    pending.set(id, { resolve: resolvePromise, reject });
    child.stdin.write(payload, (error) => {
      if (error) {
        pending.delete(id);
        reject(error);
      }
    });
  });
}

// Dev-only mock worker bootstrap. Gated by COMMAND_CENTER_DATA_MODE=mock
// (see .env.example). Must never be imported/started outside development.
// No silent fallback to mocks in production: callers must check the env var
// explicitly before calling start().
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

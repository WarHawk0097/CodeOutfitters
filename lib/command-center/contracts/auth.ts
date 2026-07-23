// auth.login — api-contracts.json operationId "auth.login"
// POST /auth/login, roles: public, errors: 401 invalid / 423 locked / 503 unavailable
import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./shared";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  userId: IdSchema,
  role: z.enum(["admin", "sales", "client-token"]),
  token: z.string(),
  issuedAt: IsoDateTimeSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const AuthErrorCodeSchema = z.enum(["invalid", "locked", "unavailable"]);

import { defineConfig } from "drizzle-kit";

// Local/dev only. No production connection string is read or stored here.
// DATABASE_URL must be set locally; see infrastructure/docker/docker-compose.yml.
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/command_center_dev",
  },
});

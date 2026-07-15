import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config. Connection URLs live here (not in schema.prisma).
 * `DIRECT_URL` is the direct connection used for migrations; falls back to
 * `DATABASE_URL`. The app runtime connects via the pg driver adapter in
 * src/lib/db.ts using `DATABASE_URL`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});

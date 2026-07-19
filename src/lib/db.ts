import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Reuse the Prisma client across hot reloads in dev to avoid exhausting
// database connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
  // Supabase's Postgres (both the pooler and direct endpoints) requires SSL.
  // node-postgres doesn't infer this from `sslmode=require` in the URL when
  // used through the Prisma driver adapter, so it's set explicitly here.
  // `rejectUnauthorized: false` matches Supabase's own connection guidance
  // (their certs chain to a CA not always present in serverless runtimes).
  const needsSsl = /supabase\.(co|com)/.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

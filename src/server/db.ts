import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a client with pgBouncer option
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true",
    },
  },
});

// Export the client
export const db = globalForPrisma.prisma ?? prisma;

// Save to global in development for hot reloading
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
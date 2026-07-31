import { PrismaClient } from "@prisma/client";
import { ENV } from "./env";
import { logger } from "./logger";

let db: PrismaClient | null = null;

export async function connectDB(): Promise<PrismaClient> {
  const databaseUrl = ENV.DATABASE_URL;

  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  });
  await prisma.$connect();
  logger.info(`DB Connected (${ENV.NODE_ENV})`);
  db = prisma;

  return prisma;
}

export async function isDBConnected(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database connection check failed", { error });
    return false;
  }
}

export function getDB(): PrismaClient {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
}

// DB proxy for convenient access throughout the app
export const DB = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") {
      return undefined;
    }
    return getDB()[prop as keyof PrismaClient];
  },
});
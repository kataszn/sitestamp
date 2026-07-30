import { PrismaClient } from "@prisma/client";
import { ENV } from "./env";
import { logger } from "./logger";

export async function connectDB(): Promise<PrismaClient> {
  const databaseUrl = ENV.DATABASE_URL;

  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  });
  await prisma.$connect();
  logger.info(`DB Connected (${ENV.NODE_ENV})`);

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
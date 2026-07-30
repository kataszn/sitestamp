import { Prisma } from "@prisma/client";

export const PrismaClientError = Prisma.PrismaClientKnownRequestError

export function isPrismaNotFound(err: Prisma.PrismaClientKnownRequestError): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err as Prisma.PrismaClientKnownRequestError).code === "P2025";
}
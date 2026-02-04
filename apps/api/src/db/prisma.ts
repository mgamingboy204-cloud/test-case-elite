import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

let shutdownRegistered = false;

export function registerPrismaShutdown() {
  if (shutdownRegistered) return;
  shutdownRegistered = true;

  const shutdown = async () => {
    await prisma.$disconnect();
  };

  process.on("beforeExit", shutdown);
  process.on("SIGINT", async () => {
    await shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await shutdown();
    process.exit(0);
  });
}

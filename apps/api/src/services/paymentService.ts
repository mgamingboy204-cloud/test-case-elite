import { prisma } from "../db/prisma";

export async function getLatestPayment(userId: string) {
  const payment = await prisma.payment.findFirst({
    where: { userId, status: "PAID" },
    orderBy: { paidAt: "desc" }
  });
  return { payment };
}

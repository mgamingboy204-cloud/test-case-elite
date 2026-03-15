import { prisma } from "../db/prisma";

export async function deactivateAccount(options: { userId: string; reason?: string }) {
  const now = new Date();

  await prisma.user.update({
    where: { id: options.userId },
    data: {
      deactivatedAt: now,
      status: "REJECTED",
      onboardingToken: null,
      onboardingTokenExpiresAt: null,
      subscriptionStatus: "CANCELED"
    }
  });

  return {
    ok: true,
    deactivatedAt: now.toISOString(),
    message: options.reason ? "Your account has been deactivated." : "Your account has been deactivated."
  };
}

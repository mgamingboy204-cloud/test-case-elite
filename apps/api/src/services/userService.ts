import { prisma } from "../db/prisma";

export async function deactivateAccount(options: { userId: string }) {
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
}

export async function updateNotificationSettings(options: { userId: string; enabled: boolean }) {
  const settings = await prisma.userPreference.upsert({
    where: { userId: options.userId },
    create: { userId: options.userId, pushNotificationsEnabled: options.enabled },
    update: { pushNotificationsEnabled: options.enabled }
  });

  return {
    updated: true,
    enabled: settings.pushNotificationsEnabled
  };
}

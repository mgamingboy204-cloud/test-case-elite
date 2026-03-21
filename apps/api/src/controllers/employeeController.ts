import { Request, Response } from "express";
import { prisma } from "../db/prisma";

function formatMemberName(member: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
}) {
  return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName || "Member";
}

export async function listEmployeeMembersHandler(_req: Request, res: Response) {
  const actorUserId = res.locals.user.id as string;
  const MAX = 40;

  const members = await prisma.user.findMany({
    where: {
      assignedEmployeeId: actorUserId,
      deletedAt: null,
      deactivatedAt: null
    },
    orderBy: { lastActiveAt: "desc" },
    take: MAX,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      status: true,
      subscriptionTier: true,
      subscriptionEndsAt: true,
      lastActiveAt: true
    }
  });

  const capacityApproaching = members.length >= 35;
  const capacity = { max: MAX, approaching: capacityApproaching };

  const formatPlan = (tier: string) => {
    if (tier === "FREE") return "Free";
    if (tier === "PREMIUM") return "Premium";
    if (tier === "ELITE") return "Elite";
    return tier;
  };

  return res.json({
    members: members.map((member) => ({
      id: member.id,
      name: formatMemberName({
        firstName: member.firstName,
        lastName: member.lastName,
        displayName: member.displayName
      }),
      status: member.status,
      plan: formatPlan(member.subscriptionTier),
      subscriptionEndsAt: member.subscriptionEndsAt ? member.subscriptionEndsAt.toISOString() : null,
      lastActivityAt: member.lastActiveAt.toISOString()
    })),
    capacity
  });
}

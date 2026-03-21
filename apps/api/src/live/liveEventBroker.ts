import crypto from "crypto";
import type { Response } from "express";

export type LiveEventType =
  | "alerts.changed"
  | "likes.changed"
  | "matches.changed"
  | "profile.changed"
  | "session.state.changed"
  | "discover.action_applied"
  | "verification.status.changed"
  | "admin.verification.queue.changed"
  | "admin.offline_meets.changed"
  | "admin.online_meets.changed"
  | "admin.dashboard.changed"
  | "admin.staff.changed"
  | "admin.audit_logs.changed"
  | "ops.case_activity.changed";

type LiveAudience = {
  userIds?: string[];
  employees?: boolean;
  admins?: boolean;
};

type LiveSubscriber = {
  id: string;
  userId: string;
  role: string | null;
  isAdmin: boolean;
  res: Response;
  heartbeatId: NodeJS.Timeout;
};

const subscribers = new Map<string, LiveSubscriber>();
const HEARTBEAT_MS = 25_000;

function uniqueUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.filter(Boolean)));
}

function sendEvent(res: Response, event: string, payload: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function canReceiveEvent(subscriber: LiveSubscriber, audience: LiveAudience) {
  if ((audience.userIds?.length ?? 0) > 0 && audience.userIds?.includes(subscriber.userId)) {
    return true;
  }

  if (audience.admins && (subscriber.role === "ADMIN" || subscriber.isAdmin)) {
    return true;
  }

  if (audience.employees && (subscriber.role === "EMPLOYEE" || subscriber.role === "ADMIN" || subscriber.isAdmin)) {
    return true;
  }

  return false;
}

function emitEvent(audience: LiveAudience, type: LiveEventType, payload: Record<string, unknown>) {
  const envelope = {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    payload
  };

  for (const [subscriberId, subscriber] of subscribers.entries()) {
    if (!canReceiveEvent(subscriber, audience)) continue;

    try {
      sendEvent(subscriber.res, "live", envelope);
    } catch {
      unregisterLiveConnection(subscriberId);
    }
  }
}

export function registerLiveConnection(options: {
  userId: string;
  role: string | null;
  isAdmin: boolean;
  res: Response;
}) {
  const id = crypto.randomUUID();
  const heartbeatId = setInterval(() => {
    try {
      sendEvent(options.res, "ping", { timestamp: new Date().toISOString() });
    } catch {
      unregisterLiveConnection(id);
    }
  }, HEARTBEAT_MS);

  const subscriber: LiveSubscriber = {
    id,
    userId: options.userId,
    role: options.role,
    isAdmin: options.isAdmin,
    res: options.res,
    heartbeatId
  };

  subscribers.set(id, subscriber);
  sendEvent(options.res, "connected", { connectionId: id, timestamp: new Date().toISOString() });

  options.res.on("close", () => {
    unregisterLiveConnection(id);
  });

  return id;
}

export function unregisterLiveConnection(connectionId: string) {
  const existing = subscribers.get(connectionId);
  if (!existing) return;
  clearInterval(existing.heartbeatId);
  subscribers.delete(connectionId);
}

export function emitAlertsChanged(userIds: string[]) {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return;
  emitEvent({ userIds: ids }, "alerts.changed", { userIds: ids });
}

export function emitLikesChanged(userIds: string[]) {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return;
  emitEvent({ userIds: ids }, "likes.changed", { userIds: ids });
}

export function emitMatchesChanged(userIds: string[]) {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return;
  emitEvent({ userIds: ids }, "matches.changed", { userIds: ids });
}

export function emitProfileChanged(userIds: string[]) {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return;
  emitEvent({ userIds: ids }, "profile.changed", { userIds: ids });
}

export function emitSessionStateChanged(userIds: string[], reason: string) {
  const ids = uniqueUserIds(userIds);
  if (ids.length === 0) return;
  emitEvent({ userIds: ids }, "session.state.changed", { userIds: ids, reason });
}

export function emitDiscoverActionApplied(options: {
  userId: string;
  targetUserId: string;
  action: "LIKE" | "PASS";
}) {
  emitEvent({ userIds: [options.userId] }, "discover.action_applied", {
    userId: options.userId,
    targetUserId: options.targetUserId,
    action: options.action
  });
}

export function emitVerificationStatusChanged(options: {
  userId: string;
  requestId: string;
  status: string;
}) {
  emitEvent({ userIds: [options.userId] }, "verification.status.changed", {
    userId: options.userId,
    requestId: options.requestId,
    status: options.status
  });
}

export function emitVerificationQueueChanged(requestId?: string) {
  emitEvent({ employees: true }, "admin.verification.queue.changed", { requestId: requestId ?? null });
}

export function emitOfflineMeetQueueChanged(caseId?: string) {
  emitEvent({ employees: true }, "admin.offline_meets.changed", { caseId: caseId ?? null });
}

export function emitOnlineMeetQueueChanged(caseId?: string) {
  emitEvent({ employees: true }, "admin.online_meets.changed", { caseId: caseId ?? null });
}

export function emitAdminDashboardChanged() {
  emitEvent({ admins: true }, "admin.dashboard.changed", {});
}

export function emitAdminStaffChanged() {
  emitEvent({ admins: true }, "admin.staff.changed", {});
}

export function emitAdminAuditLogsChanged() {
  emitEvent({ admins: true }, "admin.audit_logs.changed", {});
}

export function emitOpsCaseActivityChanged(options: {
  caseType: string;
  caseId: string;
}) {
  emitEvent({ employees: true }, "ops.case_activity.changed", {
    caseType: options.caseType,
    caseId: options.caseId
  });
}

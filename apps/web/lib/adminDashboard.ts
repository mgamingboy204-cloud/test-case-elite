import { apiRequestAuth } from "@/lib/api";

export interface AdminDashboardPayload {
  generatedAt: string;
  businessOverview: {
    totalUsers: number;
    activeSubscriptions: number;
    onboardingCompleted: number;
    employeeCount: number;
  };
  membershipAndVerification: {
    totalUsers: number;
    verifiedUsers: number;
    rejectedOrBannedUsers: number;
    rejectedUsers: number;
    bannedUsers: number;
    onboardingCompleted: number;
    verificationQueue: number;
  };
  subscriptionOverview: {
    activeSubscriptions: number;
    planDistribution: {
      ONE_MONTH: number;
      FIVE_MONTHS: number;
      TWELVE_MONTHS: number;
    };
    paymentIssueCount: number;
  };
  engagementAndMatchActivity: {
    likesCount: number;
    matchesCount: number;
    offlineMeetRequests: number;
    onlineMeetRequests: number;
    socialExchangeRequests: number;
    phoneExchangeRequests: number;
    activeSocialExchangeRequests: number;
    activePhoneExchangeRequests: number;
  };
  coordinationOperations: {
    pendingOfflineCoordination: number;
    pendingOnlineCoordination: number;
    pendingCoordinationTotal: number;
  };
  queuesAndAttention: {
    verificationQueue: number;
    pendingMatchCoordinationQueue: number;
    paymentIssueQueue: number;
    pendingOperationalFollowUps: number;
  };
  employeeWorkload: {
    totalEmployees: number;
    perEmployee: Array<{
      id: string;
      employeeId: string | null;
      name: string;
      assignedMembers: number;
      verificationActive: number;
      activeOfflineCases: number;
      activeOnlineCases: number;
      totalActiveTasks: number;
    }>;
  };
  alertsActivity: {
    recentWindowDays: number;
    recentAlertsTotal: number;
    unreadOperationalAlerts: number;
    byType: Array<{ type: string; count: number }>;
  };
}

export async function fetchAdminDashboard() {
  return apiRequestAuth<AdminDashboardPayload>("/admin/dashboard");
}

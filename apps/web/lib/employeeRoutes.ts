export const EMPLOYEE_ROUTES = {
  login: "/employee/login",
  verification: "/employee/verification",
  matches: "/employee/matches",
  members: "/employee/members",
  admin: "/employee/admin",
  legacy: {
    verification: "/verify",
    matches: "/agent",
    admin: "/admin"
  }
} as const;


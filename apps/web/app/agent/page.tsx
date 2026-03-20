import { redirect } from "next/navigation";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";

export default function LegacyAgentPage() {
  redirect(EMPLOYEE_ROUTES.matches);
}

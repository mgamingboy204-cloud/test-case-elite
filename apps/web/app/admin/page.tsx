import { redirect } from "next/navigation";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";

export default function LegacyAdminPage() {
  redirect(EMPLOYEE_ROUTES.admin);
}

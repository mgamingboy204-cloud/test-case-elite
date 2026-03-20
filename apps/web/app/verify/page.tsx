import { redirect } from "next/navigation";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";

export default function LegacyVerifyPage() {
  redirect(EMPLOYEE_ROUTES.verification);
}

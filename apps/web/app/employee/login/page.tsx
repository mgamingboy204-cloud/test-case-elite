import { redirect } from "next/navigation";

export default function LegacyEmployeeLoginRedirect() {
  redirect("/staff/login");
}

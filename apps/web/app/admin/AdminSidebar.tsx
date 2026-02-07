"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/video-verifications", label: "Video verifications" },
  { href: "/admin/verification-requests", label: "Verification requests" },
  { href: "/admin/slots", label: "Slots" }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <div className="card">
      <h3>Admin modules</h3>
      <ul className="list">
        {adminItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="list-item">
              <Link className={`text-button ${isActive ? "active" : ""}`} href={item.href}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

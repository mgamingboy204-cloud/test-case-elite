"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";

export default function AdminReportsPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const reportsQuery = useQuery({
    queryKey: queryKeys.adminReports,
    queryFn: () => apiFetch("/admin/reports"),
    staleTime: 15000
  });

  function loadReports() {
    setLoading(true);
    setMessage("Loading reports...");
    void reportsQuery.refetch().finally(() => setLoading(false));
  }

  const reports = reportsQuery.data?.reports ?? [];

  return (
    <div className="card">
      <h2>Reports</h2>
      <button onClick={loadReports} disabled={loading}>
        {loading ? "Loading..." : "Load Reports"}
      </button>
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        {reports.map((report: any) => (
          <li key={report.id} className="list-item">
            <div>
              <strong>{report.reason}</strong>
              <p className="card-subtitle">
                Reporter {report.reporter?.phone} → {report.reportedUser?.phone}
              </p>
            </div>
            <span>{report.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadReports() {
    setLoading(true);
    setMessage("Loading reports...");
    try {
      const data = await apiFetch("/admin/reports");
      setReports(data.reports ?? []);
      setMessage("Reports loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Reports</h2>
      <button onClick={loadReports} disabled={loading}>
        {loading ? "Loading..." : "Load Reports"}
      </button>
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        {reports.map((report) => (
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

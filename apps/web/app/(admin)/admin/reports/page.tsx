"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

type Report = { id: string; reason: string; details?: string | null; createdAt: string; reporter?: { phone?: string }; reportedUser?: { phone?: string } };

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await apiFetch(apiEndpoints.adminReports)) as { reports: Report[] };
      setReports(data.reports || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <div><PageHeader title="Reports" /><Skeleton height={240} radius="var(--radius-lg)" /></div>;
  if (error) return <ErrorState onRetry={load} />;
  if (!reports.length) return <EmptyState title="No reports" description="No reports found." />;

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${reports.length} total`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reports.map((report) => (
          <Card key={report.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <Badge variant="warning">{report.reason}</Badge>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(report.createdAt).toLocaleString()}</span>
            </div>
            <p style={{ margin: "6px 0", fontSize: 13 }}>Reporter: {report.reporter?.phone || "-"}</p>
            <p style={{ margin: "6px 0", fontSize: 13 }}>Reported: {report.reportedUser?.phone || "-"}</p>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{report.details || "No details"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

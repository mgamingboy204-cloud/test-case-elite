"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Chip } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Avatar } from "@/app/components/ui/Avatar";
import { apiFetch } from "@/lib/api";

type ReportStatus = "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED";

interface Report {
  id: string;
  reporterName: string;
  reportedName: string;
  reportedPhoto?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
}

const MOCK_REPORTS: Report[] = [
  {
    id: "r1",
    reporterName: "Sarah Johnson",
    reportedName: "Unknown User 42",
    reason: "Inappropriate behavior",
    details: "Sent inappropriate messages during conversation.",
    status: "OPEN",
    createdAt: "2025-12-10",
  },
  {
    id: "r2",
    reporterName: "Marcus Lee",
    reportedName: "Jane Doe",
    reason: "Fake profile",
    details: "Photos are clearly from a stock photo website.",
    status: "REVIEWING",
    createdAt: "2025-12-09",
  },
  {
    id: "r3",
    reporterName: "Emma Wilson",
    reportedName: "Bob Smith",
    reason: "Harassment",
    status: "RESOLVED",
    createdAt: "2025-12-08",
  },
  {
    id: "r4",
    reporterName: "Olivia Davis",
    reportedName: "Alex Turner",
    reason: "Spam",
    details: "Promoting an external website repeatedly.",
    status: "DISMISSED",
    createdAt: "2025-12-07",
  },
  {
    id: "r5",
    reporterName: "Noah Brown",
    reportedName: "Mystery Person",
    reason: "Underage user",
    status: "OPEN",
    createdAt: "2025-12-06",
  },
];

const STATUS_CHIPS = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Reviewing", value: "REVIEWING" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Dismissed", value: "DISMISSED" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchReports = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiFetch("/admin/reports");
      setReports(MOCK_REPORTS);
    } catch {
      setReports(MOCK_REPORTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = reports.filter(
    (r) => statusFilter === "ALL" || r.status === statusFilter
  );

  const statusVariant = (s: ReportStatus) => {
    switch (s) {
      case "OPEN":
        return "warning" as const;
      case "REVIEWING":
        return "primary" as const;
      case "RESOLVED":
        return "success" as const;
      case "DISMISSED":
        return "default" as const;
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Reports" />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={90} height={36} radius="var(--radius-full)" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={100} radius="var(--radius-lg)" style={{ marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchReports} />;

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${reports.length} reports total`} />

      {/* Status Filter Chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_CHIPS.map((chip) => (
          <Chip
            key={chip.value}
            label={chip.label}
            selected={statusFilter === chip.value}
            onClick={() => setStatusFilter(chip.value)}
          />
        ))}
      </div>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No reports"
          description="No reports match the current filter."
          action={{ label: "Show All", onClick: () => setStatusFilter("ALL") }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((report) => (
            <Card key={report.id} style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={report.reportedName} size={40} src={report.reportedPhoto} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                      {report.reportedName}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                      Reported by {report.reporterName}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
              </div>

              <div
                style={{
                  background: "var(--bg)",
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  marginBottom: report.details ? 8 : 0,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                  Reason: {report.reason}
                </p>
              </div>

              {report.details && (
                <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                  {report.details}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  {report.createdAt}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  ID: {report.id}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

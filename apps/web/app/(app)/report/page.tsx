"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

const REASONS = [
  { value: "inappropriate", label: "Inappropriate behavior" },
  { value: "fake", label: "Fake profile" },
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "underage", label: "Underage user" },
  { value: "other", label: "Other" },
];

export default function ReportPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [reportedUserId, setReportedUserId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("reportedUserId");
    if (value) setReportedUserId(value);
  }, []);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportedUserId.trim()) {
      addToast("Please provide the user ID to report", "error");
      return;
    }
    if (!reason) {
      addToast("Please select a reason", "error");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(apiEndpoints.reports, {
                body: { reportedUserId: reportedUserId.trim(), reason, details } as never,
      });
      addToast("Report submitted. Thank you.", "success");
      router.push("/discover");
    } catch {
      addToast("Failed to submit report", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Report User" subtitle="Help us keep Private Club safe" />

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Reported User ID"
            value={reportedUserId}
            onChange={(event) => setReportedUserId(event.target.value)}
            placeholder="Enter the user UUID"
          />
          <Select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={REASONS}
            placeholder="Select a reason"
          />
          <Textarea
            label="Details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide additional context..."
            rows={4}
          />
          <Button fullWidth loading={loading} onClick={handleSubmit}>
            Submit Report
          </Button>
        </div>
      </Card>
    </div>
  );
}

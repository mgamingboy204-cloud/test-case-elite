"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/Input";
import { Card } from "@/app/components/ui/Card";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

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
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [reportedUserId, setReportedUserId] = useState(searchParams.get("userId") ?? "");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportedUserId.trim()) {
      addToast("Reported user ID is required", "error");
      return;
    }
    if (!reason) {
      addToast("Please select a reason", "error");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/reports", {
        method: "POST",
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
      <PageHeader title="Report User" subtitle="Help us keep Elite Match safe" />

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Reported User ID"
            value={reportedUserId}
            onChange={(e) => setReportedUserId(e.target.value)}
            placeholder="UUID of the user"
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

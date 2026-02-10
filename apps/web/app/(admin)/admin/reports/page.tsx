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

type AdminReportsResponse = { reports: Array<{ id: string; reason: string; details?: string | null; createdAt: string; reporter?: { id: string; phone: string }; reportedUser?: { id: string; phone: string } }>; };

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

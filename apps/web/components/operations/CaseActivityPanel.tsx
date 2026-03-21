"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { addCaseNote, fetchCaseActivity, type CaseActivityEntry } from "@/lib/internalOps";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { EMPLOYEE_SUMMARY_FALLBACK_MS } from "@/lib/resourceSync";

type CaseType = "VERIFICATION" | "OFFLINE_MEET" | "ONLINE_MEET";

function formatActionLabel(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}

export function CaseActivityPanel(props: {
  caseType: CaseType;
  caseId: string | null;
  title?: string;
}) {
  const [entries, setEntries] = useState<CaseActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!props.caseId) {
      setEntries([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await fetchCaseActivity(props.caseType, props.caseId);
      setEntries(payload.entries);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to load case activity.");
    } finally {
      setLoading(false);
    }
  }, [props.caseId, props.caseType]);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveResourceRefresh({
    enabled: Boolean(props.caseId),
    refresh: () => load(),
    eventTypes: ["ops.case_activity.changed", "admin.verification.queue.changed", "admin.offline_meets.changed", "admin.online_meets.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  });

  const submitNote = async () => {
    if (!props.caseId || !note.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addCaseNote(props.caseType, props.caseId, note.trim());
      setNote("");
      await load();
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/15 bg-black/10 p-4 space-y-4">
      <div>
        <h3 className="text-sm uppercase tracking-[0.16em] text-white/70">{props.title ?? "Activity Timeline"}</h3>
        <p className="mt-1 text-xs text-white/45">Persistent audit events and internal notes for this case.</p>
      </div>

      {props.caseId ? (
        <>
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Add an internal note for the next operator or admin..."
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-sm text-white"
            />
            <button
              type="button"
              disabled={submitting || !note.trim()}
              onClick={() => void submitNote()}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-white/80 disabled:opacity-45"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquarePlus size={14} />}
              Add note
            </button>
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}

          {loading ? (
            <p className="inline-flex items-center gap-2 text-xs text-white/55">
              <Loader2 size={14} className="animate-spin" /> Loading activity...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-white/50">No timeline entries yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-white/45">
                    <span>{formatActionLabel(entry.action)}</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-xs text-white/65">
                    {entry.actor ? `${entry.actor.name} (${entry.actor.role})` : "System"}
                  </p>
                  {entry.body ? <p className="mt-2 text-sm text-white/85 whitespace-pre-wrap">{entry.body}</p> : null}
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-white/50">Select a case to view notes and timeline.</p>
      )}
    </section>
  );
}

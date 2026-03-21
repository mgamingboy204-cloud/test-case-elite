"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAddCaseNoteMutation, useCaseActivityData } from "@/lib/opsState";

type CaseType = "VERIFICATION" | "OFFLINE_MEET" | "ONLINE_MEET";

function formatActionLabel(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}

export function CaseActivityPanel(props: {
  caseType: CaseType;
  caseId: string | null;
  title?: string;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activityQuery = useCaseActivityData(props.caseType, props.caseId);
  const addNoteMutation = useAddCaseNoteMutation(props.caseType, props.caseId);
  const entries = activityQuery.data ?? [];
  const loadError = activityQuery.error instanceof Error ? activityQuery.error.message : null;

  useEffect(() => {
    setNote("");
    setError(null);
  }, [props.caseId, props.caseType]);

  const submitNote = async () => {
    if (!props.caseId || !note.trim()) return;
    setError(null);
    try {
      await addNoteMutation.mutateAsync(note.trim());
      setNote("");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.message ?? "Unable to save note.");
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
              disabled={addNoteMutation.isPending || !note.trim()}
              onClick={() => void submitNote()}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-white/80 disabled:opacity-45"
            >
              {addNoteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquarePlus size={14} />}
              Add note
            </button>
          </div>

          {error ?? loadError ? <p className="text-xs text-red-300">{error ?? loadError}</p> : null}

          {activityQuery.isPending && entries.length === 0 ? (
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

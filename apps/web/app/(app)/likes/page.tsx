"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Tabs } from "@/app/components/ui/Tabs";
import { useToast } from "@/app/providers";
import { ApiError, apiFetch } from "@/lib/api";

interface LikeUser {
  id: string;
  userId: string;
  name: string;
  city: string;
  profession: string;
  photo: string;
}

export default function LikesPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [incomingLikes, setIncomingLikes] = useState<LikeUser[]>([]);
  const [outgoingLikes, setOutgoingLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchLikes = async () => {
    setLoading(true);
    setError(false);
    try {
      const [incomingData, outgoingData] = await Promise.all([
        apiFetch<any>("/likes/incoming"),
        apiFetch<any>("/likes/outgoing"),
      ]);

      const incoming = Array.isArray(incomingData?.incoming) ? incomingData.incoming : [];
      const outgoing = Array.isArray(outgoingData?.outgoing) ? outgoingData.outgoing : [];

      setIncomingLikes(incoming.map((item: any) => ({
        id: item.id,
        userId: item.fromUser?.id,
        name: item.fromUser?.profile?.name ?? "Member",
        city: item.fromUser?.profile?.city ?? "",
        profession: item.fromUser?.profile?.profession ?? "",
        photo: item.fromUser?.profile?.photos?.[0]?.url ?? "",
      })).filter((item: LikeUser) => Boolean(item.userId)));

      setOutgoingLikes(outgoing.map((item: any) => ({
        id: item.id,
        userId: item.toUser?.id,
        name: item.toUser?.profile?.name ?? "Member",
        city: item.toUser?.profile?.city ?? "",
        profession: item.toUser?.profile?.profession ?? "",
        photo: item.toUser?.profile?.photos?.[0]?.url ?? "",
      })).filter((item: LikeUser) => Boolean(item.userId)));
    } catch {
      setError(true);
      setIncomingLikes([]);
      setOutgoingLikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLikes();
  }, []);

  const handleAction = async (like: LikeUser, type: "LIKE" | "PASS") => {
    setActioning(like.id);
    try {
      await apiFetch("/likes", {
        method: "POST",
        retryOnUnauthorized: true,
        body: { actionId: `likes-page:${like.userId}:${type}:${Date.now()}`, toUserId: like.userId, type } as never,
      });
      setIncomingLikes((prev) => prev.filter((l) => l.id !== like.id));
      addToast(type === "LIKE" ? `You liked ${like.name}!` : `Passed on ${like.name}`, type === "LIKE" ? "success" : "info");
      await fetchLikes();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        addToast("Session expired. Please sign in and try again.", "error");
      } else {
        addToast("Action failed", "error");
      }
    } finally {
      setActioning(null);
    }
  };

  const likes = tab === "incoming" ? incomingLikes : outgoingLikes;

  if (loading) {
    return <div><PageHeader title="Likes" subtitle="Incoming and outgoing likes" /><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1, 2, 3].map((i) => <Skeleton key={i} height={80} radius="var(--radius-lg)" />)}</div></div>;
  }

  if (error) return <ErrorState onRetry={fetchLikes} />;

  return (
    <div>
      <PageHeader title="Likes" subtitle={`${incomingLikes.length} incoming · ${outgoingLikes.length} outgoing`} />
      <Tabs active={tab} onChange={(v) => setTab(v as "incoming" | "outgoing")} tabs={[{ value: "incoming", label: "Incoming" }, { value: "outgoing", label: "Outgoing" }]} style={{ marginBottom: 12 }} />
      {likes.length === 0 ? <EmptyState title="No likes yet" description="Keep swiping! Your next match could be one like away." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {likes.map((like) => (
            <Card key={like.id} className="fade-in" style={{ display: "flex", alignItems: "center", padding: 16, gap: 16 }}>
              <Avatar src={like.photo} name={like.name} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: 16 }}>{like.name}</h4>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{like.city} &middot; {like.profession}</p>
              </div>
              {tab === "incoming" && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Button variant="ghost" size="sm" loading={actioning === like.id} onClick={() => handleAction(like, "PASS")} style={{ color: "var(--muted)" }}>Pass</Button>
                  <Button size="sm" loading={actioning === like.id} onClick={() => handleAction(like, "LIKE")}>Like</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

interface IncomingLike {
  id: string;
  userId: string;
  name: string;
  city: string;
  profession: string;
  photo: string;
}

const MOCK_LIKES: IncomingLike[] = [
  { id: "l1", userId: "u1", name: "Neha Sharma", city: "Mumbai", profession: "Designer", photo: "https://picsum.photos/seed/neha/200/200" },
  { id: "l2", userId: "u2", name: "Vikram Patel", city: "Delhi", profession: "Engineer", photo: "https://picsum.photos/seed/vikram/200/200" },
  { id: "l3", userId: "u3", name: "Aisha Khan", city: "Bangalore", profession: "Doctor", photo: "https://picsum.photos/seed/aisha/200/200" },
];

export default function LikesPage() {
  const { addToast } = useToast();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchLikes = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<any>("/likes/incoming");
      const incoming = Array.isArray(data?.incoming) ? data.incoming : [];
      const mapped: IncomingLike[] = incoming.map((item: any) => ({
        id: item.id,
        userId: item.fromUser?.id,
        name: item.fromUser?.profile?.name ?? "Member",
        city: item.fromUser?.profile?.city ?? "",
        profession: item.fromUser?.profile?.profession ?? "",
        photo: item.fromUser?.profile?.photos?.[0]?.url ?? "",
      })).filter((item: IncomingLike) => Boolean(item.userId));
      setLikes(mapped);
    } catch {
      setLikes(MOCK_LIKES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, []);

  const handleAction = async (like: IncomingLike, type: "LIKE" | "PASS") => {
    setActioning(like.id);
    try {
      await apiFetch("/likes", {
        method: "POST",
        body: { toUserId: like.userId, type } as never,
      });
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
      addToast(
        type === "LIKE" ? `You liked ${like.name}!` : `Passed on ${like.name}`,
        type === "LIKE" ? "success" : "info"
      );
    } catch {
      addToast("Action failed", "error");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Likes" subtitle="People who liked you" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={80} radius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchLikes} />;

  return (
    <div>
      <PageHeader
        title="Likes"
        subtitle={`${likes.length} people liked you`}
      />

      {likes.length === 0 ? (
        <EmptyState
          title="No likes yet"
          description="Keep swiping! Your next match could be a like away."
          icon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {likes.map((like) => (
            <Card
              key={like.id}
              className="fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                padding: 16,
                gap: 16,
              }}
            >
              <Avatar src={like.photo} name={like.name} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: 16 }}>{like.name}</h4>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
                  {like.city} &middot; {like.profession}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={actioning === like.id}
                  onClick={() => handleAction(like, "PASS")}
                  style={{ color: "var(--muted)" }}
                >
                  Pass
                </Button>
                <Button
                  size="sm"
                  loading={actioning === like.id}
                  onClick={() => handleAction(like, "LIKE")}
                >
                  Like
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

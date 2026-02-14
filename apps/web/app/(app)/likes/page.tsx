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
import { apiEndpoints } from "@/lib/apiEndpoints";

interface IncomingLike {
  id: string;
  userId: string;
  name: string;
  city: string;
  profession: string;
  photo: string;
}

type IncomingLikesResponse = {
  incoming: Array<{
    fromUserId: string;
    createdAt: string;
    fromUser?: {
      id: string;
      profile?: {
        name?: string | null;
        city?: string | null;
        profession?: string | null;
      } | null;
      photos?: Array<{ url: string }>;
    } | null;
  }>;
};

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
      const data = (await apiFetch(apiEndpoints.likesIncoming)) as IncomingLikesResponse;
      setLikes(
        (data.incoming ?? []).map((like) => ({
          id: `${like.fromUserId}-${like.createdAt}`,
          userId: like.fromUserId,
          name: like.fromUser?.profile?.name || "Member",
          city: like.fromUser?.profile?.city || "",
          profession: like.fromUser?.profile?.profession || "",
          photo: like.fromUser?.photos?.[0]?.url || "/placeholder.svg"
        }))
      );
    } catch {
      setError(true);
      setLikes([]);
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
      await apiFetch(apiEndpoints.likes, {
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
      <PageHeader title="Likes" subtitle={`${likes.length} people liked you`} />

      {likes.length === 0 ? (
        <EmptyState
          title="No likes yet"
          description="Keep swiping! Your next match could be a like away."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {likes.map((like) => (
            <Card key={like.id} className="fade-in" style={{ display: "flex", alignItems: "center", padding: 16, gap: 16 }}>
              <Avatar src={like.photo} name={like.name} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: 16 }}>{like.name}</h4>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{like.city} {like.profession ? `· ${like.profession}` : ""}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Button variant="ghost" size="sm" loading={actioning === like.id} onClick={() => handleAction(like, "PASS")} style={{ color: "var(--muted)" }}>
                  Pass
                </Button>
                <Button size="sm" loading={actioning === like.id} onClick={() => handleAction(like, "LIKE")}>
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

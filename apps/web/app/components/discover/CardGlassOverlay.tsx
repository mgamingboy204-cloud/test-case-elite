import { Badge } from "@/app/components/ui/Badge";

interface CardGlassOverlayProps {
  name: string;
  age: number;
  city: string;
  bio: string;
  verified: boolean;
}

function buildTags(bio: string, verified: boolean): string[] {
  const tags: string[] = [];

  if (verified) {
    tags.push("Verified");
  }

  const compactBio = bio
    .split(/[|,.]/)
    .map((item) => item.trim())
    .filter(Boolean)[0];

  if (compactBio) {
    tags.push(compactBio.slice(0, 18));
  }

  return tags.slice(0, 2);
}

export function CardGlassOverlay({ name, age, city, bio, verified }: CardGlassOverlayProps) {
  const tags = buildTags(bio, verified);

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-3xl border border-white/25 bg-black/30 p-4 text-white shadow-[0_12px_40px_rgba(5,6,16,0.35)] backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="max-w-[70%] truncate text-[1.4rem] font-semibold leading-tight">
          {name}, {age}
        </h2>
      </div>
      <p className="truncate text-sm text-white/85">{city || "Location hidden"}</p>
      <p className="mt-1 truncate text-sm text-white/70">{bio || "Premium member"}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-hidden">
          {tags.map((tag) => (
            <Badge
              key={tag}
              style={{
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.16)",
                color: "#fff",
                maxWidth: 132,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

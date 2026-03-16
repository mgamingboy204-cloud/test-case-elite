"use client";

export function ProtectedState({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-border/40 bg-card/60 p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-foreground/70">{description}</p>
      </div>
    </div>
  );
}

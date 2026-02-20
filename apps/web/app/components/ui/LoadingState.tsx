"use client";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export default function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={`loading-state ${className || ""}`.trim()}>
      <div className="skeleton-card" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <p className="text-muted">{message}</p>
    </div>
  );
}

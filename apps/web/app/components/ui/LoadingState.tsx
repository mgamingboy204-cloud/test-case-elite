"use client";

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <div className="skeleton-card" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <p className="text-muted">{message}</p>
    </div>
  );
}

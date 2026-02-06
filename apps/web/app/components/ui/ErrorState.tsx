"use client";

import Button from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <h3>{title}</h3>
      <p className="text-muted">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

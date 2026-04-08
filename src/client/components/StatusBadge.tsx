import React from "react";

interface StatusBadgeProps {
  status: "idle" | "running" | "stopped" | "errored";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    idle: "bg-runny-muted",
    running: "bg-runny-green",
    stopped: "bg-runny-muted",
    errored: "bg-runny-red",
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status]} ${status === "running" ? "animate-pulse" : ""}`}
      title={status}
    />
  );
}

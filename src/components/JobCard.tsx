"use client";

import { useState } from "react";
import { Job } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Props {
  job: Job;
  onCompleted: () => void;
}

const DESCRIPTION_THRESHOLD = 100;

export default function JobCard({ job, onCompleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const description = job.quote?.description ?? "";
  const isLong = description.length > DESCRIPTION_THRESHOLD;

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${job.id}/complete`, { method: "PATCH" });

      if (res.ok) {
        onCompleted();
        return;
      }

      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {job.quote?.title ?? "Job"}
          </h3>
          <p className="text-xs text-text-secondary">
            {formatDateRange(job.scheduledStart, job.scheduledEnd)}
          </p>
        </div>
        <Badge status={job.status} />
      </div>

      {description && (
        <div className="flex flex-col gap-1">
          <p className={`text-sm text-text-secondary ${!expanded && isLong ? "line-clamp-2" : ""}`}>
            {description}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-brand-primary hover:underline self-start"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {job.manager && (
        <span className="text-xs text-text-secondary">
          Assigned by{" "}
          <span className="font-medium text-text-primary">{job.manager.name}</span>
        </span>
      )}

      {error && (
        <p className="text-xs text-error bg-error-light border border-error/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {job.status === "SCHEDULED" && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setConfirming(true)}>
            Mark Complete
          </Button>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40"
          onMouseDown={() => setConfirming(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-base font-semibold text-text-primary">Mark job as complete?</h2>
              <p className="text-sm text-text-secondary mt-1">
                {job.quote?.title} — this will notify the manager and cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={completing}>
                Cancel
              </Button>
              <Button size="sm" isLoading={completing} onClick={handleComplete}>
                Yes, complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

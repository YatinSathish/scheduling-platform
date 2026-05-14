"use client";

import { useEffect, useState } from "react";
import { Job } from "@/lib/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import JobCard from "@/components/JobCard";
import NotificationBell from "@/components/NotificationBell";
import UserSwitcher from "@/components/UserSwitcher";

export default function TechnicianPage() {
  const currentUserId = useCurrentUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!currentUserId) return;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch(`/api/jobs?technicianId=${currentUserId}`);
        setJobs(await r.json());
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [currentUserId, refresh]);

  const scheduled = jobs.filter((j) => j.status === "SCHEDULED");
  const completed = jobs.filter((j) => j.status === "COMPLETED");

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <UserSwitcher role="TECHNICIAN" variant="heading" />
          <div className="mt-2 flex items-center gap-2">
            {loading ? (
              <div className="h-6 w-40 bg-border rounded-full animate-pulse" />
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-status-scheduled-bg text-status-scheduled-text">
                  <span className="font-bold">{scheduled.length}</span> upcoming
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-status-completed-bg text-status-completed-text">
                  <span className="font-bold">{completed.length}</span>{" "}
                  completed
                </span>
              </>
            )}
          </div>
        </div>
        <NotificationBell
          recipientType="TECHNICIAN"
          recipientId={currentUserId}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 max-w-2xl">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-surface border border-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-text-primary font-medium">No jobs scheduled</p>
          <p className="text-sm text-text-secondary">
            Jobs assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-2xl">
          {scheduled.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-status-scheduled-text uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-status-scheduled-text" />
                Upcoming
              </h2>
              {scheduled.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCompleted={() => setRefresh((n) => n + 1)}
                />
              ))}
            </section>
          )}

          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-status-completed-text uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-status-completed-text" />
                Completed
              </h2>
              {completed.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCompleted={() => setRefresh((n) => n + 1)}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Quote } from "@/lib/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import QuoteCard from "@/components/QuoteCard";
import NotificationBell from "@/components/NotificationBell";
import UserSwitcher from "@/components/UserSwitcher";

export default function ManagerPage() {
  const currentUserId = useCurrentUser();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const r = await fetch("/api/quotes");
        setQuotes(await r.json());
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [refresh]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <UserSwitcher role="MANAGER" variant="heading" />
          <div className="mt-2">
            {loading ? (
              <div className="h-6 w-40 bg-border rounded-full animate-pulse" />
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-brand-light text-brand-primary">
                <span className="font-bold">{quotes.length}</span>
                unscheduled quote{quotes.length !== 1 ? "s" : ""} awaiting assignment
              </span>
            )}
          </div>
        </div>
        <NotificationBell recipientType="MANAGER" recipientId={currentUserId} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-text-primary font-medium">All caught up</p>
          <p className="text-sm text-text-secondary">No unscheduled quotes at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              managerId={currentUserId ?? ""}
              onAssigned={() => setRefresh((n) => n + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

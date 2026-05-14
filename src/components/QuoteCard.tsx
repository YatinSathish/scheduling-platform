"use client";

import { useState } from "react";
import { Quote } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AssignModal from "@/components/AssignModal";

interface Props {
  quote: Quote;
  managerId: string;
  onAssigned: () => void;
}

const DESCRIPTION_THRESHOLD = 100;

export default function QuoteCard({ quote, managerId, onAssigned }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isLong = quote.description.length > DESCRIPTION_THRESHOLD;

  return (
    <>
      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary">{quote.title}</h3>
          <Badge status={quote.status} />
        </div>

        <div className="flex flex-col gap-1">
          <p className={`text-sm text-text-secondary ${!expanded && isLong ? "line-clamp-2" : ""}`}>
            {quote.description}
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

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            {quote.manager && (
              <span className="text-xs text-text-secondary">
                Requested by{" "}
                <span className="text-text-primary font-medium">{quote.manager.name}</span>
              </span>
            )}
            <span className="text-xs text-text-disabled">
              {formatRelativeTime(quote.createdAt)}
            </span>
          </div>

          <Button size="sm" onClick={() => setModalOpen(true)}>
            Assign
          </Button>
        </div>
      </Card>

      {modalOpen && (
        <AssignModal
          quote={quote}
          managerId={managerId}
          onClose={() => setModalOpen(false)}
          onAssigned={() => {
            setModalOpen(false);
            onAssigned();
          }}
        />
      )}
    </>
  );
}

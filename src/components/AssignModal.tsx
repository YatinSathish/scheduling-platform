"use client";

import { useEffect, useState } from "react";
import { Quote, Technician } from "@/lib/types";
import Button from "@/components/ui/Button";

interface Props {
  quote: Quote;
  managerId: string;
  onClose: () => void;
  onAssigned: () => void;
}

// 30-minute slots from 7:00am to 5:00pm (job ends by 7:00pm)
const ALL_SLOTS: string[] = [];
for (let h = 7; h <= 17; h++) {
  ALL_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17) ALL_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function formatSlot(slot: string): string {
  const [hStr, mStr] = slot.split(":");
  const h = parseInt(hStr);
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${mStr} ${period}`;
}

const selectClass =
  "text-sm border border-border rounded-lg px-3 py-2 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed";

export default function AssignModal({ quote, managerId, onClose, onAssigned }: Props) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [technicianId, setTechnicianId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/technicians")
      .then((r) => r.json())
      .then((data: Technician[]) => {
        setTechnicians(data);
        if (data.length > 0) setTechnicianId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!technicianId || !date) return;
    async function fetchSlots() {
      setLoadingSlots(true);
      setTime("");
      try {
        const r = await fetch(`/api/availability?technicianId=${technicianId}&date=${date}`);
        const data: { takenSlots: string[] } = await r.json();
        setTakenSlots(data.takenSlots);
      } catch {
        setTakenSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    void fetchSlots();
  }, [technicianId, date]);

  const handleSubmit = async () => {
    if (!technicianId || !date || !time) {
      setError("Please select a technician, date, and start time.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const scheduledStart = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id, technicianId, managerId, scheduledStart }),
      });

      if (res.status === 201) {
        onAssigned();
        onClose();
        return;
      }

      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40"
      onMouseDown={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-semibold text-text-primary">Assign Job</h2>
          <p className="text-sm text-text-secondary mt-0.5">{quote.title}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Technician</label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className={selectClass}
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className={selectClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Start time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!date || loadingSlots}
              className={selectClass}
            >
              <option value="">
                {loadingSlots ? "Checking availability…" : !date ? "Pick a date first" : "Select a time"}
              </option>
              {ALL_SLOTS.map((slot) => {
                const taken = takenSlots.includes(slot);
                return (
                  <option key={slot} value={slot} disabled={taken}>
                    {formatSlot(slot)}{taken ? " (unavailable)" : ""}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-text-secondary">Job runs for 2 hours from this time.</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-error bg-error-light border border-error/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" isLoading={submitting} onClick={handleSubmit}>
            Assign Job
          </Button>
        </div>
      </div>
    </div>
  );
}

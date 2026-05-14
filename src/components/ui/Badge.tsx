import { JobStatus, QuoteStatus } from "@/lib/types";
import { getStatusBadgeClasses } from "@/lib/utils";

interface BadgeProps {
  status: JobStatus | QuoteStatus;
}

const statusLabels: Record<JobStatus | QuoteStatus, string> = {
  UNSCHEDULED: "Unscheduled",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-medium
        ${getStatusBadgeClasses(status)}
      `}
    >
      {statusLabels[status]}
    </span>
  );
}

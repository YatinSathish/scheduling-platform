export type QuoteStatus = "UNSCHEDULED" | "SCHEDULED";
export type JobStatus = "SCHEDULED" | "COMPLETED";
export type RecipientType = "TECHNICIAN" | "MANAGER";

export interface Manager {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Quote {
  id: string;
  title: string;
  description: string;
  status: QuoteStatus;
  managerId: string;
  manager?: Manager;
  createdAt: Date;
}

export interface Job {
  id: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: JobStatus;
  quoteId: string;
  quote?: Quote;
  technicianId: string;
  technician?: Technician;
  managerId: string;
  manager?: Manager;
  createdAt: Date;
}

export interface Notification {
  id: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  recipientType: RecipientType;
  technicianId: string | null;
  technician?: Technician;
  managerId: string | null;
  manager?: Manager;
  jobId: string;
  job?: Job;
}

// API response shapes
export interface AssignJobBody {
  quoteId: string;
  technicianId: string;
  managerId: string;
  scheduledStart: string; // ISO string from client
}

export interface ApiError {
  error: string;
}

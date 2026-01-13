"use client";

import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import type { JobStatus } from "@/types";

interface TimelineEvent {
  status: JobStatus;
  label: string;
  date?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface JobStatusTimelineProps {
  status: JobStatus;
  createdAt: string;
  completedAt?: string;
}

export function JobStatusTimeline({ status, createdAt, completedAt }: JobStatusTimelineProps) {
  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "accepted":
        return <CheckCircle className="w-5 h-5" />;
      case "in_progress":
        return <AlertCircle className="w-5 h-5" />;
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      case "disputed":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: JobStatus, isCompleted: boolean, isCurrent: boolean) => {
    if (isCurrent) {
      switch (status) {
        case "pending":
          return "bg-yellow-500 text-white";
        case "accepted":
          return "bg-blue-500 text-white";
        case "in_progress":
          return "bg-purple-500 text-white";
        case "completed":
          return "bg-green-500 text-white";
        case "cancelled":
          return "bg-red-500 text-white";
        case "disputed":
          return "bg-orange-500 text-white";
        default:
          return "bg-gray-500 text-white";
      }
    }
    return isCompleted ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500";
  };

  const getStatusLabel = (status: JobStatus): string => {
    switch (status) {
      case "pending":
        return "Request Submitted";
      case "accepted":
        return "Job Accepted";
      case "in_progress":
        return "Work In Progress";
      case "completed":
        return "Job Completed";
      case "cancelled":
        return "Job Cancelled";
      case "disputed":
        return "Dispute Raised";
      default:
        return status;
    }
  };

  // Build timeline based on current status
  const timeline: TimelineEvent[] = [];
  
  // Always start with pending (created)
  timeline.push({
    status: "pending",
    label: getStatusLabel("pending"),
    date: createdAt,
    isCompleted: status !== "pending",
    isCurrent: status === "pending",
  });

  // If accepted or beyond, add accepted
  if (["accepted", "in_progress", "completed"].includes(status)) {
    timeline.push({
      status: "accepted",
      label: getStatusLabel("accepted"),
      isCompleted: true,
      isCurrent: status === "accepted",
    });
  }

  // If in_progress or completed, add in_progress
  if (["in_progress", "completed"].includes(status)) {
    timeline.push({
      status: "in_progress",
      label: getStatusLabel("in_progress"),
      isCompleted: true,
      isCurrent: status === "in_progress",
    });
  }

  // If completed, add completed
  if (status === "completed") {
    timeline.push({
      status: "completed",
      label: getStatusLabel("completed"),
      date: completedAt,
      isCompleted: true,
      isCurrent: true,
    });
  }

  // If cancelled, add cancelled
  if (status === "cancelled") {
    timeline.push({
      status: "cancelled",
      label: getStatusLabel("cancelled"),
      isCompleted: true,
      isCurrent: true,
    });
  }

  // If disputed, add disputed
  if (status === "disputed") {
    timeline.push({
      status: "disputed",
      label: getStatusLabel("disputed"),
      isCompleted: true,
      isCurrent: true,
    });
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-gray-500" />
        Status Timeline
      </h3>
      <div className="space-y-4">
        {timeline.map((event, index) => (
          <div key={index} className="flex gap-4">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                  event.status,
                  event.isCompleted,
                  event.isCurrent
                )}`}
              >
                {getStatusIcon(event.status)}
              </div>
              {index < timeline.length - 1 && (
                <div
                  className={`w-0.5 h-full min-h-[40px] ${
                    event.isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Event details */}
            <div className="flex-1 pb-4">
              <p
                className={`font-medium ${
                  event.isCurrent ? "text-gray-900" : "text-gray-600"
                }`}
              >
                {event.label}
              </p>
              {event.date && (
                <p className="text-sm text-gray-500 mt-1">{formatDate(event.date)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

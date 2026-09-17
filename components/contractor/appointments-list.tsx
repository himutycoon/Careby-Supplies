"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { cancelAppointment, getAppointments } from "@/services/appointments";
import { formatDate } from "@/lib/format";

export function AppointmentsList({ limit }: { limit?: number }) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getAppointments);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function cancel(dbId: string) {
    setPendingId(dbId);
    const result = await cancelAppointment(dbId);
    setPendingId(null);

    if (result.ok) {
      toast("Call cancelled");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: limit ?? 2 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load calls"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const appointments = data ?? [];
  const visible = limit ? appointments.slice(0, limit) : appointments;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon="Phone"
        title="No calls scheduled"
        description="Book a call when you'd rather place a large order with a person."
        action={
          <Button
            render={<Link href="/contractor/call-order">Schedule a call</Link>}
          />
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {visible.map((appointment) => (
        <li
          key={appointment.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{appointment.category} call</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3" aria-hidden="true" />
                {formatDate(appointment.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3" aria-hidden="true" />
                {appointment.time}
              </span>
              <span>{appointment.id}</span>
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {appointment.status}
          </Badge>

          {/* Only scheduled calls can be cancelled, and only the owner —
              the call_orders update policy enforces that server-side. */}
          {appointment.status === "scheduled" && appointment.dbId ? (
            <Button
              variant="ghost"
              size="sm"
              className="press"
              disabled={pendingId === appointment.dbId}
              onClick={() => cancel(appointment.dbId!)}
            >
              {pendingId === appointment.dbId ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

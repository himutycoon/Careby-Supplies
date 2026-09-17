import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import type { Appointment } from "@/lib/types";

interface CallOrderRow {
  id: string;
  reference: string;
  category: string;
  preferred_date: string;
  preferred_time: string;
  notes: string;
  status: string;
  created_at: string;
}

function mapAppointment(row: CallOrderRow): Appointment {
  return {
    id: row.reference,
    dbId: row.id,
    category: row.category,
    date: row.preferred_date,
    time: row.preferred_time,
    notes: row.notes,
    status: row.status === "cancelled" ? "cancelled" : "scheduled",
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, reference, category, preferred_date, preferred_time, notes, status, created_at";

export interface CreateAppointmentInput {
  category: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  time: string;
  notes?: string;
  phone?: string;
  projectId?: string;
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<ServiceResult<Appointment>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to schedule a call.");

  if (!input.category) return fail("Choose a category.");
  if (!input.date) return fail("Choose a date.");
  if (!input.time) return fail("Choose a time.");

  const { data, error } = await supabase
    .from("call_orders")
    .insert({
      reference: `CALL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      user_id: user.id,
      project_id: input.projectId ?? null,
      category: input.category,
      preferred_date: input.date,
      preferred_time: input.time,
      phone: input.phone?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    console.error("[createAppointment]", error);
    return fail(toUserMessage(error, "We couldn't schedule that call."));
  }
  return ok(mapAppointment(data as unknown as CallOrderRow));
}

export async function getAppointments(): Promise<Appointment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("call_orders")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as CallOrderRow[]).map(mapAppointment);
}

export async function cancelAppointment(
  id: string,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("call_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[cancelAppointment]", error);
    return fail(toUserMessage(error, "We couldn't cancel that call."));
  }
  return ok(null);
}

/** Next weekdays — the call desk is closed on weekends. */
export function availableDates(count = 5): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const cursor = new Date();

  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day === 0 || day === 6) continue;
    dates.push({
      // Built from the local calendar date, not toISOString() — that
      // converts to UTC first, so an evening in Toronto would offer a
      // value one day ahead of the label beside it.
      value: [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-"),
      label: cursor.toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    });
  }
  return dates;
}

export const AVAILABLE_TIMES = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

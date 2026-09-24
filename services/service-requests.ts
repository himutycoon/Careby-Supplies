import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";

export type ServiceRequestStatus =
  | "requested"
  | "reviewing"
  | "contacted"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  reference: string;
  serviceType: string;
  category: string;
  subcategory: string;
  status: ServiceRequestStatus;
  details: Record<string, unknown>;
  notes: string;
  createdAt: string;
}

interface ServiceRequestRow {
  id: string;
  reference: string;
  service_type: string;
  category: string;
  subcategory: string;
  status: ServiceRequestStatus;
  details: Record<string, unknown> | null;
  notes: string;
  created_at: string;
}

function mapRequest(row: ServiceRequestRow): ServiceRequest {
  return {
    id: row.id,
    reference: row.reference,
    serviceType: row.service_type,
    category: row.category,
    subcategory: row.subcategory,
    status: row.status,
    details: row.details ?? {},
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, reference, service_type, category, subcategory, status, details, notes, created_at";

export interface CreateServiceRequestInput {
  serviceType: string;
  category?: string;
  subcategory?: string;
  details?: Record<string, unknown>;
  notes?: string;
  projectId?: string;
}

export async function createServiceRequest(
  input: CreateServiceRequestInput,
): Promise<ServiceResult<ServiceRequest>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to make a request.");
  if (!input.serviceType) return fail("Service type is required.");

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      reference: `REQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      user_id: user.id,
      project_id: input.projectId ?? null,
      service_type: input.serviceType,
      category: input.category ?? "",
      subcategory: input.subcategory ?? "",
      details: input.details ?? {},
      notes: input.notes?.trim() ?? "",
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    console.error("[createServiceRequest]", error);
    return fail(toUserMessage(error, "We couldn't submit that request."));
  }
  return ok(mapRequest(data as unknown as ServiceRequestRow));
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_requests")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as ServiceRequestRow[]).map(mapRequest);
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * The service taxonomy, from the database rather than a hardcoded list,
 * so an admin can add or retire a service without a deploy. Used by the
 * premium request form to build its selectable options.
 */
export async function getServices(): Promise<ServiceOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, icon")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data) {
    console.error("[getServices]", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    icon: (row.icon as string) ?? "Wrench",
  }));
}

// --- Premium package requests -------------------------------------------

export interface PremiumRequest {
  id: string;
  reference: string;
  selectedServices: string[];
  status: ServiceRequestStatus;
  budgetRange: string;
  notes: string;
  createdAt: string;
  /**
   * Whether the `details` write landed. The tier lives in there, and the
   * checkout route prices from the tier — so a caller about to send
   * someone to Stripe needs to know the row can actually be priced.
   */
  detailsSaved: boolean;
}

export interface CreatePremiumRequestInput {
  selectedServices: string[];
  budgetRange?: string;
  notes?: string;
  /**
   * Engagement tier, project profile and contact preference from the
   * guided wizard. Stored as jsonb so the questions can change without a
   * migration — same pattern as renovation_details.answers.
   */
  details?: Record<string, unknown>;
}

export async function createPremiumRequest(
  input: CreatePremiumRequestInput,
): Promise<ServiceResult<PremiumRequest>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to request the premium package.");
  if (input.selectedServices.length === 0) {
    return fail("Select at least one service.");
  }

  // The core insert deliberately omits `details`: that column arrives in
  // schema-07, and sending an unknown column would fail the whole
  // submission. The enquiry is what matters — the extra profile answers
  // are attached separately below.
  const { data, error } = await supabase
    .from("premium_requests")
    .insert({
      reference: `PRM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      user_id: user.id,
      selected_services: input.selectedServices,
      budget_range: input.budgetRange ?? "",
      notes: input.notes?.trim() ?? "",
    })
    .select(
      "id, reference, selected_services, status, budget_range, notes, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[createPremiumRequest]", error);
    return fail(toUserMessage(error, "We couldn't submit that request."));
  }

  const hasDetails = Boolean(
    input.details && Object.keys(input.details).length > 0,
  );
  let detailsSaved = !hasDetails;

  if (hasDetails) {
    const { error: detailError } = await supabase
      .from("premium_requests")
      .update({ details: input.details })
      .eq("id", data.id as string);

    // Logged, never surfaced: the advisor still has the enquiry. The
    // caller is told, though, because payment is priced off this column.
    if (detailError) {
      console.error("[createPremiumRequest:details]", detailError);
    } else {
      detailsSaved = true;
    }
  }

  return ok({
    id: data.id as string,
    reference: data.reference as string,
    selectedServices: (data.selected_services as string[]) ?? [],
    status: data.status as ServiceRequestStatus,
    budgetRange: (data.budget_range as string) ?? "",
    notes: (data.notes as string) ?? "",
    createdAt: data.created_at as string,
    detailsSaved,
  });
}

/**
 * Premium requests belong to the same "things I've asked for" list as
 * service requests, but they live in their own table — so the dashboard
 * showed a repair request and silently dropped the premium enquiry the
 * same person had just spent four steps submitting.
 *
 * Normalised into the ServiceRequest shape so one list can render both.
 */
export async function getPremiumRequestsAsServiceRequests(): Promise<
  ServiceRequest[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("premium_requests")
    .select(
      "id, reference, selected_services, status, budget_range, notes, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[getPremiumRequestsAsServiceRequests]", error);
    return [];
  }

  return data.map((row) => {
    const services = (row.selected_services as string[]) ?? [];
    return {
      id: row.id as string,
      reference: row.reference as string,
      serviceType: "premium_package",
      category: "Premium package",
      subcategory: services.join(", "),
      status: row.status as ServiceRequestStatus,
      details: {},
      notes: (row.notes as string) ?? "",
      createdAt: row.created_at as string,
    };
  });
}

/**
 * Everything the signed-in user has asked us for, newest first.
 * RLS scopes both queries to their own rows.
 */
export async function getAllMyRequests(): Promise<ServiceRequest[]> {
  const [requests, premium] = await Promise.all([
    getServiceRequests(),
    getPremiumRequestsAsServiceRequests(),
  ]);

  return [...requests, ...premium].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminEmail } from "@/lib/supabase/is-admin";
import type { DeliveredPlan, Submission } from "@/lib/types";

interface SubmissionRow {
  id: string;
  user_id: string;
  input: Submission["input"];
  estimate: Submission["estimate"];
  status: Submission["status"];
  created_at: string;
  delivered_at: string | null;
}

function mapSubmissionRow(row: SubmissionRow): Submission {
  return {
    id: row.id,
    userId: row.user_id,
    input: row.input,
    estimate: row.estimate,
    status: row.status,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
  };
}

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminEmail(user?.email);
}

export async function getAllRealSubmissions(): Promise<Submission[]> {
  if (!(await requireAdmin())) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SubmissionRow[]).map(mapSubmissionRow);
}

export async function getRealSubmissionByIdAdmin(
  id: string,
): Promise<Submission | null> {
  if (!(await requireAdmin())) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapSubmissionRow(data as SubmissionRow);
}

interface DeliveredPlanRow {
  submission_id: string;
  after_image_urls: string[];
  plan_notes: string;
  layout_description: string;
  admin_adjusted_cost: DeliveredPlan["adminAdjustedCost"];
  delivered_by: string;
  delivered_at: string;
}

export async function getDeliveredPlanByIdAdmin(
  submissionId: string,
): Promise<DeliveredPlan | null> {
  if (!(await requireAdmin())) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("delivered_plans")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as DeliveredPlanRow;
  return {
    submissionId: row.submission_id,
    afterImageUrls: row.after_image_urls,
    planNotes: row.plan_notes,
    layoutDescription: row.layout_description,
    adminAdjustedCost: row.admin_adjusted_cost,
    deliveredBy: row.delivered_by,
    deliveredAt: row.delivered_at,
  };
}

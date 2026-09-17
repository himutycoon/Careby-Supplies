import { createClient } from "@/lib/supabase/server";
import { buildPlaceholderNarrative } from "@/lib/report/build-placeholder-narrative";
import type { DeliveredPlan, Report, ReportNarrative, Submission } from "@/lib/types";

interface SubmissionRow {
  id: string;
  user_id: string;
  input: Submission["input"];
  estimate: Submission["estimate"];
  status: Submission["status"];
  created_at: string;
  delivered_at: string | null;
}

function mapRow(row: SubmissionRow): Submission {
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

export async function getRealSubmissionById(
  id: string,
): Promise<Submission | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as SubmissionRow);
}

export async function getRealSubmissionsForCurrentUser(): Promise<
  Submission[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as SubmissionRow[]).map(mapRow);
}

/**
 * How many `projects` rows the signed-in user owns.
 *
 * The dashboard shows submissions and projects in one section, and its
 * "No projects yet" empty state has to account for both — otherwise a
 * homeowner whose only project came from the New Construction wizard was
 * told they had nothing, directly above the thing they had.
 */
export async function countProjectsForCurrentUser(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (error) return 0;
  return count ?? 0;
}

interface DeliveredPlanRow {
  submission_id: string;
  after_image_urls: string[];
  plan_notes: string;
  layout_description: string;
  admin_adjusted_cost: DeliveredPlan["adminAdjustedCost"];
  delivered_by: string;
  delivered_at: string;
  narrative: ReportNarrative | null;
}

export async function getRealReportById(id: string): Promise<Report | null> {
  const submission = await getRealSubmissionById(id);
  if (!submission || submission.status !== "delivered") return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivered_plans")
    .select("*")
    .eq("submission_id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as DeliveredPlanRow;
  const deliveredPlan: DeliveredPlan = {
    submissionId: row.submission_id,
    afterImageUrls: row.after_image_urls,
    planNotes: row.plan_notes,
    layoutDescription: row.layout_description,
    adminAdjustedCost: row.admin_adjusted_cost,
    deliveredBy: row.delivered_by,
    deliveredAt: row.delivered_at,
  };

  const cost = deliveredPlan.adminAdjustedCost ?? submission.estimate.cost;
  const narrative =
    row.narrative ??
    buildPlaceholderNarrative(submission.estimate, deliveredPlan, cost);

  return { ...submission, deliveredPlan, narrative };
}

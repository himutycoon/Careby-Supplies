import { createClient } from "@/lib/supabase/client";
import type { ConstructionTierId } from "@/lib/rules/construction-packages";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import type { Project, ProjectStatus } from "@/lib/types";

interface ProjectRow {
  id: string;
  owner_id: string;
  project_type: Project["type"];
  subtype: string;
  title: string;
  description: string;
  location: string;
  status: string;
  budget: number | null;
  created_at: string;
  support_package?: string | null;
  support_package_price?: number | null;
}

/** DB uses snake_case statuses; the UI type uses hyphenated ones. */
const STATUS_TO_UI: Record<string, ProjectStatus> = {
  planning: "planning",
  in_progress: "in-progress",
  materials_ready: "materials-ready",
  completed: "completed",
  cancelled: "completed",
};

const STATUS_TO_DB: Record<ProjectStatus, string> = {
  planning: "planning",
  "in-progress": "in_progress",
  "materials-ready": "materials_ready",
  completed: "completed",
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.title,
    type: row.project_type,
    subtype: row.subtype,
    status: STATUS_TO_UI[row.status] ?? "planning",
    location: row.location,
    notes: row.description,
    createdAt: row.created_at,
    supportPackage: row.support_package || undefined,
    supportPackagePriceCad:
      row.support_package_price === null ||
      row.support_package_price === undefined
        ? undefined
        : Number(row.support_package_price),
  };
}

const BASE_SELECT =
  "id, owner_id, project_type, subtype, title, description, location, status, budget, created_at";

/**
 * support_package arrives in schema-08. Asking for a column that doesn't
 * exist fails the whole select, which would blank every project screen —
 * so reads try the wider shape and fall back, the same way
 * getAllProductsForAdmin() handles low_stock_threshold.
 */
const SELECT = `${BASE_SELECT}, support_package, support_package_price`;

async function selectProjects(
  build: (columns: string) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<ProjectRow[] | null> {
  const wide = await build(SELECT);
  const usable = wide.error ? await build(BASE_SELECT) : wide;
  if (usable.error || !usable.data) return null;
  return (Array.isArray(usable.data) ? usable.data : [usable.data]) as ProjectRow[];
}

export interface CreateProjectInput {
  name: string;
  type: Project["type"];
  subtype: string;
  location?: string;
  notes?: string;
  budget?: number;
  /**
   * Support tier from the Category Order flow. The flow offered Basic /
   * Standard / Premium and then discarded the answer — it was never
   * stored, never charged, and never reached anyone who could act on it.
   */
  supportPackage?: { name: string; priceCad: number | null };
  /** Persisted into the matching detail table when supplied. */
  renovationDetails?: {
    propertyType: "condo" | "house";
    isOwner: boolean;
    renovationType: string;
    answers?: Record<string, unknown>;
  };
  newConstructionDetails?: {
    /* "paid"/"premium" are the pre-schema-14 names, still accepted by the
       column's check constraint so old rows stay valid. */
    tier: ConstructionTierId | "paid" | "premium";
    answers: Record<string, unknown>;
    estimateLow?: number;
    estimateHigh?: number;
    assumptions?: string[];
  };
}

export async function createProject(
  input: CreateProjectInput,
): Promise<ServiceResult<Project>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to create a project.");
  if (!input.name.trim()) return fail("Project name is required.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      project_type: input.type,
      subtype: input.subtype,
      title: input.name.trim(),
      description: input.notes?.trim() ?? "",
      location: input.location?.trim() || "Mississauga, ON",
      budget: input.budget ?? null,
    })
    .select(BASE_SELECT)
    .single();

  if (error || !data) {
    console.error("[createProject]", error);
    return fail(toUserMessage(error, "We couldn't create that project."));
  }

  const project = mapProject(data as unknown as ProjectRow);

  // Applied separately, and only logged on failure: the columns arrive in
  // schema-08, and a project the contractor is waiting on must not fail
  // because an optional field couldn't be written.
  if (input.supportPackage) {
    const { error: packageError } = await supabase
      .from("projects")
      .update({
        support_package: input.supportPackage.name,
        support_package_price: input.supportPackage.priceCad,
      })
      .eq("id", project.id);

    if (packageError) console.error("[createProject:support]", packageError);
    else {
      project.supportPackage = input.supportPackage.name;
      project.supportPackagePriceCad =
        input.supportPackage.priceCad ?? undefined;
    }
  }

  if (input.renovationDetails) {
    const { error: detailError } = await supabase
      .from("renovation_details")
      .insert({
        project_id: project.id,
        property_type: input.renovationDetails.propertyType,
        is_owner: input.renovationDetails.isOwner,
        renovation_type: input.renovationDetails.renovationType,
        answers: input.renovationDetails.answers ?? {},
      });
    if (detailError) console.error("[createProject:renovation]", detailError);
  }

  if (input.newConstructionDetails) {
    const { error: detailError } = await supabase
      .from("new_construction_details")
      .insert({
        project_id: project.id,
        tier: input.newConstructionDetails.tier,
        answers: input.newConstructionDetails.answers,
        estimate_low: input.newConstructionDetails.estimateLow ?? null,
        estimate_high: input.newConstructionDetails.estimateHigh ?? null,
        estimate_assumptions: input.newConstructionDetails.assumptions ?? [],
      });
    if (detailError) console.error("[createProject:construction]", detailError);
  }

  return ok(project);
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const rows = await selectProjects((columns) =>
    supabase
      .from("projects")
      .select(columns)
      .order("created_at", { ascending: false }),
  );

  return (rows ?? []).map(mapProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = createClient();
  const rows = await selectProjects((columns) =>
    supabase.from("projects").select(columns).eq("id", id).maybeSingle(),
  );

  const row = rows?.[0];
  return row ? mapProject(row) : null;
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<ServiceResult<Project>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      status: STATUS_TO_DB[status],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(BASE_SELECT)
    .single();

  if (error || !data) {
    console.error("[updateProjectStatus]", error);
    return fail(toUserMessage(error, "We couldn't update that project."));
  }
  return ok(mapProject(data as unknown as ProjectRow));
}

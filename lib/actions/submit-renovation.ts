"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzePhotos, type PhotoInput } from "@/lib/claude/analyze-photos";
import { calculateCostEstimate } from "@/lib/rules/calculate-cost";
import { ROOM_TYPE_OPTIONS } from "@/data/mock";
import type { EstimateResult, RenovationInput } from "@/lib/types";

function mediaTypeFromFilename(name: string): PhotoInput["mediaType"] {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

export async function submitRenovation(
  input: RenovationInput,
  photoPaths: string[],
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired — please log in again." };
  }

  let photos: PhotoInput[];
  try {
    photos = await Promise.all(
      photoPaths.map(async (path) => {
        const { data, error } = await supabase.storage
          .from("renovation-photos")
          .download(path);
        if (error || !data) {
          throw new Error(`Could not read uploaded photo: ${path}`);
        }
        const buffer = Buffer.from(await data.arrayBuffer());
        return {
          base64: buffer.toString("base64"),
          mediaType: mediaTypeFromFilename(path),
        };
      }),
    );
  } catch {
    return {
      error: "We couldn't read your uploaded photos. Please try again.",
    };
  }

  let estimate: EstimateResult;
  try {
    const vision = await analyzePhotos(input.roomType, photos);
    const { cost, permits, verdict } = calculateCostEstimate(input, vision);

    estimate = {
      verdict,
      vision,
      cost,
      permits,
      scopeLevel: input.scopeLevel,
      budgetCad: input.budgetCad,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      error:
        "We couldn't analyze your photos right now. Please try submitting again in a moment.",
    };
  }

  // The submission insert is deliberately unchanged and happens FIRST.
  // The estimate is what the homeowner is waiting on, so nothing added
  // below is allowed to put it at risk — including the case where
  // schema-06 hasn't been applied yet and submissions.project_id does
  // not exist.
  const { data: inserted, error: insertError } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      input,
      estimate,
      status: "submitted",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: "Something went wrong saving your submission." };
  }

  // A renovation is also a project, so it appears in My Projects and the
  // admin Projects screen alongside every other flow. Best-effort: a
  // failure here is logged, never surfaced, and never loses the estimate.
  const projectId = await createRenovationProject(supabase, user.id, input);

  if (projectId) {
    const { error: linkError } = await supabase
      .from("submissions")
      .update({ project_id: projectId })
      .eq("id", inserted.id);

    if (linkError) {
      console.error("[submitRenovation:link]", linkError);
    }
  }

  return { id: inserted.id };
}

/**
 * Creates the projects + renovation_details rows for a submission.
 *
 * Returns null rather than throwing: a failure here must not cost the
 * homeowner their estimate. Anything that goes wrong is logged so it
 * surfaces in server logs instead of silently vanishing.
 */
async function createRenovationProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: RenovationInput,
): Promise<string | null> {
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((option) => option.value === input.roomType)
      ?.label ?? input.roomType;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      // The DB check constraint uses underscores; RoomType uses hyphens.
      project_type: "renovation",
      subtype: input.roomType,
      title: `${roomLabel} renovation`,
      description: input.notes?.trim() ?? "",
      location: input.municipalityId || "Mississauga, ON",
      budget: input.budgetCad,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    console.error("[submitRenovation:project]", projectError);
    return null;
  }

  const { error: detailError } = await supabase
    .from("renovation_details")
    .insert({
      project_id: project.id,
      property_type: input.propertyType,
      is_owner: input.isOwner,
      renovation_type: input.roomType,
      // Everything the wizard collected that has no dedicated column, so
      // adding a question later doesn't need a migration.
      answers: {
        lengthFt: input.lengthFt,
        widthFt: input.widthFt,
        ceilingHeightFt: input.ceilingHeightFt,
        scopeLevel: input.scopeLevel,
        wishlist: input.wishlist,
        municipalityId: input.municipalityId,
      },
    });

  if (detailError) {
    console.error("[submitRenovation:renovationDetails]", detailError);
  }

  return project.id as string;
}

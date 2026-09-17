"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isAdminEmail } from "@/lib/supabase/is-admin";
import { generateNarrative } from "@/lib/claude/generate-narrative";
import type { DeliveredPlan, EstimateResult } from "@/lib/types";

export async function deliverPlan(
  submissionId: string,
  formData: FormData,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return { error: "Not authorized." };
  }

  const planNotes = String(formData.get("planNotes") ?? "");
  const layoutDescription = String(formData.get("layoutDescription") ?? "");
  const files = formData.getAll("afterImages").filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );

  const admin = createAdminClient();

  const { data: submissionRow, error: fetchError } = await admin
    .from("submissions")
    .select("estimate")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError || !submissionRow) {
    return { error: "Could not find this submission." };
  }

  const estimate = submissionRow.estimate as EstimateResult;

  const afterImageUrls: string[] = [];
  for (const file of files) {
    const path = `${submissionId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await admin.storage
      .from("delivered-plans")
      .upload(path, file);
    if (uploadError) {
      return { error: `Could not upload ${file.name}.` };
    }
    afterImageUrls.push(path);
  }

  const deliveredAt = new Date().toISOString();
  const deliveredPlan: DeliveredPlan = {
    submissionId,
    afterImageUrls,
    planNotes,
    layoutDescription,
    adminAdjustedCost: null,
    deliveredBy: user!.email!,
    deliveredAt,
  };

  const narrative = await generateNarrative(
    estimate,
    deliveredPlan,
    estimate.cost,
  );

  const { error: upsertError } = await admin.from("delivered_plans").upsert({
    submission_id: submissionId,
    after_image_urls: afterImageUrls,
    plan_notes: planNotes,
    layout_description: layoutDescription,
    admin_adjusted_cost: null,
    delivered_by: user!.email,
    delivered_at: deliveredAt,
    narrative,
  });

  if (upsertError) {
    return { error: "Could not save the delivered plan." };
  }

  const { error: updateError } = await admin
    .from("submissions")
    .update({ status: "delivered", delivered_at: deliveredAt })
    .eq("id", submissionId);

  if (updateError) {
    return { error: "Plan saved, but the submission status failed to update." };
  }

  return { ok: true };
}

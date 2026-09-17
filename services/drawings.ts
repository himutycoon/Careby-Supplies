import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import type { CalculatedMaterial, DrawingUpload } from "@/lib/types";

const BUCKET = "drawings";
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

interface DrawingRow {
  id: string;
  reference: string;
  project_name: string;
  location: string;
  drawing_type: string;
  comments: string;
  file_path: string;
  file_name: string;
  processing_status: string;
  created_at: string;
}

function mapDrawing(row: DrawingRow): DrawingUpload {
  return {
    id: row.reference,
    dbId: row.id,
    projectName: row.project_name,
    location: row.location,
    drawingType: row.drawing_type,
    comments: row.comments,
    fileNames: [row.file_name],
    filePath: row.file_path,
    status: row.processing_status === "ready" ? "ready" : "analyzing",
    createdAt: row.created_at,
  };
}

const SELECT =
  "id, reference, project_name, location, drawing_type, comments, file_path, file_name, processing_status, created_at";

export function validateDrawingFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${file.name} isn't a PDF, JPG or PNG.`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name} is larger than 10 MB.`;
  }
  return null;
}

export interface UploadDrawingInput {
  projectName: string;
  location: string;
  drawingType: string;
  comments: string;
  file: File;
  projectId?: string;
}

/**
 * Uploads to the private `drawings` bucket under the user's own folder
 * (storage RLS enforces that prefix), then records the row.
 */
export async function uploadDrawing(
  input: UploadDrawingInput,
): Promise<ServiceResult<DrawingUpload>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to upload a drawing.");

  if (!input.projectName.trim()) return fail("Project name is required.");

  const validationError = validateDrawingFile(input.file);
  if (validationError) return fail(validationError);

  const path = `${user.id}/${crypto.randomUUID()}-${input.file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, { contentType: input.file.type });

  if (uploadError) {
    console.error("[uploadDrawing:storage]", uploadError);
    return fail("We couldn't upload that file. Please try again.");
  }

  const { data, error } = await supabase
    .from("drawing_uploads")
    .insert({
      reference: `DWG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      user_id: user.id,
      project_id: input.projectId ?? null,
      project_name: input.projectName.trim(),
      location: input.location.trim() || "Mississauga, ON",
      drawing_type: input.drawingType,
      comments: input.comments.trim(),
      file_path: path,
      file_name: input.file.name,
      file_type: input.file.type,
      file_size: input.file.size,
      processing_status: "analyzing",
    })
    .select(SELECT)
    .single();

  if (error || !data) {
    console.error("[uploadDrawing:insert]", error);
    await supabase.storage.from(BUCKET).remove([path]);
    return fail(toUserMessage(error, "We couldn't save that drawing."));
  }

  return ok(mapDrawing(data as unknown as DrawingRow));
}

/**
 * Material takeoff.
 *
 * NOT an automated analysis of the drawing — no takeoff engine exists
 * yet. This writes a clearly-marked `prototype` calculation so the
 * ordering flow works end to end; an admin (or a future automated
 * engine) replaces these rows with real quantities. The
 * `calculation_source` column records which produced them.
 */
export async function calculateMaterials(
  drawingDbId: string,
): Promise<ServiceResult<CalculatedMaterial[]>> {
  const supabase = createClient();

  const PROTOTYPE_ROWS = [
    { material_name: "Framing lumber (2x4)", category: "lumber", quantity: 320, unit: "ft", estimated_price: 1352, product_id: "lum-2x4-8" },
    { material_name: "Drywall sheets (½ in)", category: "hardware", quantity: 42, unit: "sheets", estimated_price: 661.5, product_id: "drw-sheet" },
    { material_name: "Floor tile", category: "flooring", quantity: 850, unit: "sq ft", estimated_price: 1062.5, product_id: "flr-tile-12" },
    { material_name: "Plywood sheathing (¾ in)", category: "lumber", quantity: 24, unit: "sheets", estimated_price: 1008, product_id: "lum-ply-4x8" },
    { material_name: "Electrical wire 12/2", category: "electrical", quantity: 500, unit: "ft", estimated_price: 425, product_id: "elc-wire-12" },
  ];

  const { data, error } = await supabase
    .from("material_calculations")
    .insert(
      PROTOTYPE_ROWS.map((row) => ({
        ...row,
        drawing_id: drawingDbId,
        calculation_source: "prototype",
        confidence: "unverified",
      })),
    )
    .select("id, material_name, category, quantity, unit, estimated_price, product_id");

  if (error || !data) {
    console.error("[calculateMaterials]", error);
    return fail(toUserMessage(error, "We couldn't prepare a material list."));
  }

  await supabase
    .from("drawing_uploads")
    .update({
      processing_status: "ready",
      material_calculation_status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", drawingDbId);

  return ok(
    data.map((row) => ({
      id: row.id as string,
      material: row.material_name as string,
      quantity: Number(row.quantity),
      unit: row.unit as string,
      estimatedCostCad: Number(row.estimated_price),
      productId: (row.product_id as string | null) ?? undefined,
    })),
  );
}

export async function getDrawings(): Promise<DrawingUpload[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawing_uploads")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as DrawingRow[]).map(mapDrawing);
}

/** Private bucket — hand out short-lived signed URLs, never public ones. */
export async function getDrawingSignedUrl(
  filePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}

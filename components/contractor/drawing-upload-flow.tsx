"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  FileText,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useCart } from "@/components/shop/cart-provider";
import { useToast } from "@/components/shared/toast";
import {
  calculateMaterials,
  uploadDrawing,
  validateDrawingFile,
} from "@/services/drawings";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalculatedMaterial } from "@/lib/types";

const DRAWING_TYPES = ["Floor Plan", "Elevation", "Site Plan", "Section", "Other"];

interface PendingFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

type Phase = "idle" | "uploading" | "analyzing" | "results";

export function DrawingUploadFlow() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { add } = useCart();
  const { toast } = useToast();

  const [files, setFiles] = React.useState<PendingFile[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [materials, setMaterials] = React.useState<CalculatedMaterial[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const [form, setForm] = React.useState({
    projectName: "",
    location: "Mississauga, ON",
    drawingType: DRAWING_TYPES[0],
    comments: "",
  });

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next: PendingFile[] = [];

    for (const file of Array.from(list)) {
      // Single source of truth: the same check the service runs before
      // upload, so the UI can't drift from what the server accepts.
      const problem = validateDrawingFile(file);
      if (problem) {
        setError(problem);
        continue;
      }
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        size: file.size,
        file,
      });
    }

    if (next.length > 0) setFiles((prev) => [...prev, ...next]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError("Add at least one drawing first.");
      return;
    }
    if (!form.projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    setPhase("uploading");
    setProgress(0);

    // Upload progress — real byte progress once storage is wired.
    const timer = setInterval(() => {
      setProgress((value) => Math.min(value + 12, 100));
    }, 110);

    // One drawing per record — upload the first file selected.
    const uploaded = await uploadDrawing({
      ...form,
      file: files[0].file,
    });

    clearInterval(timer);
    setProgress(100);

    if (!uploaded.ok) {
      setPhase("idle");
      setError(uploaded.error);
      toast(uploaded.error, "error");
      return;
    }

    toast("Drawing uploaded successfully");
    setPhase("analyzing");

    const calculated = await calculateMaterials(uploaded.data.dbId!);
    if (!calculated.ok) {
      setPhase("idle");
      setError(calculated.error);
      return;
    }

    setMaterials(calculated.data);
    setSelected(new Set(calculated.data.map((m) => m.id)));
    setPhase("results");
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSelectedToCart() {
    const chosen = materials.filter(
      (m) => selected.has(m.id) && m.productId,
    );
    if (chosen.length === 0) {
      toast("Select at least one material with a catalog match.", "error");
      return;
    }
    chosen.forEach((material) => {
      add(material.productId!, Math.max(1, Math.round(material.quantity / 10)));
    });
    toast(`${chosen.length} materials added to cart`);
  }

  if (phase === "analyzing") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="size-7 animate-spin" aria-hidden="true" />
        </span>
        <h2 className="text-2xl">Analyzing drawing…</h2>
        <p className="max-w-md text-muted-foreground">
          Preparing a material list from{" "}
          {files.map((f) => f.name).join(", ")}.
        </p>
      </div>
    );
  }

  if (phase === "results") {
    const selectedMaterials = materials.filter((m) => selected.has(m.id));
    const estimatedTotal = selectedMaterials.reduce(
      (sum, m) => sum + m.estimatedCostCad,
      0,
    );

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Info
            className="mt-0.5 size-4 shrink-0 text-warning-foreground"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            <strong className="font-medium text-foreground">
              Prototype quantities.
            </strong>{" "}
            These are representative figures, not a measured takeoff from
            your drawing — there&apos;s no takeoff engine connected yet. Our
            team reviews every drawing before quantities are confirmed.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
            <div>
              <h2 className="text-xl">Estimated materials</h2>
              <p className="text-sm text-muted-foreground">
                {form.projectName} · {form.drawingType}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelected(
                  selected.size === materials.length
                    ? new Set()
                    : new Set(materials.map((m) => m.id)),
                )
              }
            >
              {selected.size === materials.length
                ? "Deselect all"
                : "Select all"}
            </Button>
          </div>

          <ul className="divide-y divide-border">
            {materials.map((material) => (
              <li
                key={material.id}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <input
                  type="checkbox"
                  checked={selected.has(material.id)}
                  onChange={() => toggle(material.id)}
                  className="size-4 shrink-0 accent-primary"
                  aria-label={`Select ${material.material}`}
                />
                <span className="min-w-0 flex-1 text-sm font-medium">
                  {material.material}
                </span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {material.quantity} {material.unit}
                </span>
                <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {formatCad(material.estimatedCostCad)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedMaterials.length} selected
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCad(estimatedTotal)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPhase("idle");
                  setFiles([]);
                  setProgress(0);
                  setMaterials([]);
                }}
              >
                Upload another
              </Button>
              <Button onClick={addSelectedToCart}>
                Add selected to cart
              </Button>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-fit"
          render={<Link href="/cart">View cart</Link>}
        />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud className="size-7" aria-hidden="true" />
          </span>
          <h2 className="text-xl">Upload Your Drawing</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll help calculate the materials required for your project.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            Drag &amp; drop, or browse
          </Button>
          <p className="text-xs text-muted-foreground">
            PDF, JPG or PNG · up to 10 MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      </div>

      {error ? (
        <p
          className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <FileText
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setFiles((prev) => prev.filter((f) => f.id !== file.id))
                }
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {phase === "uploading" ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Uploading…</span>
            <span className="text-muted-foreground tabular-nums">
              {progress}%
            </span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}

      <fieldset className="grid gap-5 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
        <legend className="px-1 text-lg font-medium">Project information</legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="drawing-project">Project name</Label>
          <Input
            id="drawing-project"
            value={form.projectName}
            onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            placeholder="Kitchen remodel"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="drawing-type">Drawing type</Label>
          <select
            id="drawing-type"
            value={form.drawingType}
            onChange={(e) => setForm({ ...form, drawingType: e.target.value })}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {DRAWING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="drawing-location">Location</Label>
          <Input
            id="drawing-location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="drawing-notes">Notes / comments</Label>
          <Textarea
            id="drawing-notes"
            rows={3}
            value={form.comments}
            onChange={(e) => setForm({ ...form, comments: e.target.value })}
            placeholder="Anything the takeoff should account for — finishes, exclusions, phasing…"
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {files.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setFiles([])}
            disabled={phase === "uploading"}
          >
            <Trash2 className="size-4" /> Clear files
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          size="lg"
          disabled={phase === "uploading" || files.length === 0}
        >
          {phase === "uploading" ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Calculate Materials
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

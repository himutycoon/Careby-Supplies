"use client";

import * as React from "react";
import { AlertTriangle, Download, FileUp, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/shared/toast";
import { parseCsv, toCsv } from "@/lib/csv";
import { formatCad } from "@/lib/format";
import {
  TEMPLATE_COLUMNS,
  TEMPLATE_HEADERS,
  commitProductImport,
  planProductImport,
  type ProductImportPlan,
} from "@/services/product-import";
import type { AdminCategoryRow } from "@/services/admin";

/**
 * Bulk product import from a spreadsheet.
 *
 * CSV rather than .xlsx: an .xlsx is a zip of XML and needs a parser
 * dependency to read, while every spreadsheet app exports CSV from
 * "Save as". The wording below tells the admin exactly that, so the
 * limitation reads as an instruction rather than a failure.
 *
 * Nothing is written until the admin has seen what will happen — the
 * file is parsed and validated in the browser first, and rows that
 * can't be imported are listed with their line numbers.
 */
export function ProductImportDialog({
  open,
  onOpenChange,
  categories,
  existingIds,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AdminCategoryRow[];
  /** Ids already in the catalog, to tell a create from an update. */
  existingIds: string[];
  onImported: () => void;
}) {
  const { toast } = useToast();
  const [fileName, setFileName] = React.useState("");
  const [plan, setPlan] = React.useState<ProductImportPlan | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function reset() {
    setFileName("");
    setPlan(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (/\.xlsx?$/i.test(file.name)) {
      toast(
        "That's an Excel workbook. In Excel choose File → Save As → CSV, then upload that.",
      );
      reset();
      return;
    }

    setParsing(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      setPlan(
        planProductImport(
          parseCsv(text),
          categories.map((c) => ({ id: c.id, name: c.name })),
          existingIds,
        ),
      );
    } catch {
      toast("We couldn't read that file.");
      reset();
    } finally {
      setParsing(false);
    }
  }

  function downloadTemplate() {
    const example = [
      "lum-2x4-10",
      "Pressure Treated Lumber 2x4x10",
      "Timberline",
      categories[0]?.name ?? "",
      "12.95",
      "11.20",
      "piece",
      "250",
      "40",
      "Kiln-dried, rated for ground contact.",
      "",
      "true",
    ];
    const csv = toCsv([
      TEMPLATE_COLUMNS.map((column) => TEMPLATE_HEADERS[column]),
      example,
    ]);

    // A blob download rather than a data: URI — Safari refuses long
    // data: URLs, and a sheet of columns gets long quickly.
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "careby-product-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!plan || plan.rows.length === 0) return;
    setImporting(true);
    const result = await commitProductImport(plan.rows);
    setImporting(false);

    if (!result.ok) {
      toast(result.error);
      return;
    }
    toast(
      `${result.data.written} product${result.data.written === 1 ? "" : "s"} imported.`,
    );
    reset();
    onOpenChange(false);
    onImported();
  }

  const created = plan?.rows.filter((row) => row.isNew).length ?? 0;
  const updated = (plan?.rows.length ?? 0) - created;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CSV to add products or update existing ones. Rows are
            matched on <span className="font-medium">id</span> — an id that
            already exists is updated, a new one is created.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="press w-full sm:w-auto"
              onClick={downloadTemplate}
            >
              <Download className="size-4" /> Download template
            </Button>
            <Button
              variant="outline"
              className="press w-full sm:w-auto"
              onClick={() => inputRef.current?.click()}
              disabled={parsing}
            >
              {parsing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              {fileName || "Choose CSV file"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Exporting from Excel? File → Save As → CSV. Only{" "}
            <span className="font-medium">name</span> and{" "}
            <span className="font-medium">price</span> are required; missing
            trade price falls back to retail, and a missing id is generated
            from the name.
          </p>

          {plan ? (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-md bg-success/10 px-2.5 py-1 font-medium text-success">
                  {created} to create
                </span>
                <span className="rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  {updated} to update
                </span>
                {plan.issues.length > 0 ? (
                  <span className="rounded-md bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                    {plan.issues.length} skipped
                  </span>
                ) : null}
              </div>

              {plan.unknownColumns.length > 0 ? (
                <p className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Ignored {plan.unknownColumns.length === 1 ? "column" : "columns"}
                    : {plan.unknownColumns.join(", ")}. Check for a typo if one
                    of those was meant to be imported.
                  </span>
                </p>
              ) : null}

              {plan.rows.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 text-right font-medium">Price</th>
                        <th className="px-3 py-2 text-right font-medium">Stock</th>
                        <th className="px-3 py-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.rows.slice(0, 40).map((row) => (
                        <tr key={row.input.id} className="border-t border-border">
                          <td className="px-3 py-2">
                            <span className="font-medium">{row.input.name}</span>
                            <span className="block text-muted-foreground">
                              {row.input.id}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.input.categoryId || "—"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCad(row.input.homeownerPrice)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row.input.stockQuantity}
                          </td>
                          <td className="px-3 py-2">
                            {row.isNew ? (
                              <span className="text-success">Create</span>
                            ) : (
                              <span className="text-primary">Update</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {plan.rows.length > 40 ? (
                    <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                      …and {plan.rows.length - 40} more.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {plan.issues.length > 0 ? (
                <details className="rounded-lg border border-destructive/30 bg-destructive/5">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-destructive">
                    {plan.issues.length} row
                    {plan.issues.length === 1 ? "" : "s"} won&apos;t be imported
                  </summary>
                  <ul className="flex flex-col gap-1 px-3 pt-1 pb-3 text-xs text-muted-foreground">
                    {plan.issues.slice(0, 30).map((issue) => (
                      <li key={`${issue.line}-${issue.message}`}>
                        <span className="font-medium text-foreground">
                          Line {issue.line}:
                        </span>{" "}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !plan || plan.rows.length === 0}
          >
            {importing ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Importing…
              </>
            ) : (
              <>
                <Upload className="size-4" /> Import {plan?.rows.length ?? 0}{" "}
                product{plan?.rows.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

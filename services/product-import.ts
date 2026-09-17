import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import type { AdminProductInput } from "@/services/admin";

/**
 * Bulk product import.
 *
 * Planning is deliberately separate from writing: an import of 200 rows
 * that fails halfway is worse than one that refuses to start, so the
 * dialog shows what will happen — row by row — before anything is
 * written. planProductImport() is pure and does no I/O, which also
 * makes the column matching and money parsing testable on their own.
 */

export interface ProductImportIssue {
  /** 1-based line in the file, as the admin sees it in their editor. */
  line: number;
  message: string;
}

export interface PlannedRow {
  line: number;
  input: AdminProductInput;
  isNew: boolean;
}

export interface ProductImportPlan {
  rows: PlannedRow[];
  issues: ProductImportIssue[];
  /** Headers we didn't recognise, surfaced so a typo isn't silent. */
  unknownColumns: string[];
}

/**
 * Header aliases, so a sheet exported from anywhere sensible works
 * without the admin renaming columns first. Compared after lowercasing
 * and stripping everything but letters and digits, so "Stock Quantity",
 * "stock_quantity" and "STOCKQUANTITY" are all the same header.
 */
const COLUMN_ALIASES = {
  id: ["id", "sku", "productid", "code"],
  name: ["name", "productname", "title"],
  brand: ["brand", "manufacturer", "make"],
  category: ["category", "categoryid", "department"],
  homeownerPrice: ["homeownerprice", "price", "retailprice", "listprice"],
  contractorPrice: ["contractorprice", "tradeprice", "wholesaleprice"],
  unit: ["unit", "uom", "unitofmeasure"],
  stockQuantity: ["stockquantity", "stock", "quantity", "qty", "onhand"],
  lowStockThreshold: ["lowstockthreshold", "lowstock", "reorderpoint"],
  description: ["description", "details", "notes"],
  imageUrl: ["imageurl", "image", "photo", "imagelink"],
  isActive: ["isactive", "active", "published", "visible"],
} satisfies Record<string, string[]>;

type Column = keyof typeof COLUMN_ALIASES;

/** Columns the template writes, in order. */
export const TEMPLATE_COLUMNS: Column[] = [
  "id",
  "name",
  "brand",
  "category",
  "homeownerPrice",
  "contractorPrice",
  "unit",
  "stockQuantity",
  "lowStockThreshold",
  "description",
  "imageUrl",
  "isActive",
];

export const TEMPLATE_HEADERS: Record<Column, string> = {
  id: "id",
  name: "name",
  brand: "brand",
  category: "category",
  homeownerPrice: "homeowner_price",
  contractorPrice: "contractor_price",
  unit: "unit",
  stockQuantity: "stock_quantity",
  lowStockThreshold: "low_stock_threshold",
  description: "description",
  imageUrl: "image_url",
  isActive: "is_active",
};

const normaliseHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Slug-safe id, matching what the single-product form generates. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * Money as a human types it: "$1,299.00" and "1299" both parse. Returns
 * null when there is no number at all, so a caller can tell a blank cell
 * from a zero.
 */
function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBool(value: string, fallback: boolean): boolean {
  const text = value.trim().toLowerCase();
  if (text === "") return fallback;
  return ["true", "yes", "y", "1", "active", "published"].includes(text);
}

export function planProductImport(
  table: string[][],
  categories: { id: string; name: string }[],
  existingIds: string[] = [],
): ProductImportPlan {
  const issues: ProductImportIssue[] = [];
  const rows: PlannedRow[] = [];

  if (table.length === 0) {
    return {
      rows,
      issues: [{ line: 0, message: "That file is empty." }],
      unknownColumns: [],
    };
  }

  const header = table[0].map(normaliseHeader);
  const index = {} as Partial<Record<Column, number>>;
  const matched = new Set<number>();

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const found = header.findIndex((cell) =>
      (aliases as string[]).includes(cell),
    );
    if (found !== -1) {
      index[field as Column] = found;
      matched.add(found);
    }
  }

  const unknownColumns = table[0]
    .map((cell, i) => ({ cell: cell.trim(), i }))
    .filter((entry) => entry.cell !== "" && !matched.has(entry.i))
    .map((entry) => entry.cell);

  if (index.name === undefined) {
    issues.push({
      line: 1,
      message:
        "No 'name' column found. The first row has to be a header row — download the template to see the expected columns.",
    });
    return { rows, issues, unknownColumns };
  }

  const cellAt = (row: string[], field: Column) => {
    const at = index[field];
    return at === undefined ? "" : (row[at] ?? "").trim();
  };

  // Category matched by id or by display name, both case-insensitively:
  // an admin typing "Plumbing" shouldn't need to know the id is
  // "plumbing".
  const categoryLookup = new Map<string, string>();
  for (const category of categories) {
    categoryLookup.set(category.id.toLowerCase(), category.id);
    categoryLookup.set(category.name.toLowerCase(), category.id);
  }

  const known = new Set(existingIds);
  const seenInFile = new Map<string, number>();

  for (let r = 1; r < table.length; r += 1) {
    const row = table[r];
    const line = r + 1;

    const name = cellAt(row, "name");
    if (name === "") {
      issues.push({ line, message: "Skipped — no product name." });
      continue;
    }

    const rawId = cellAt(row, "id");
    const id = rawId !== "" ? slugify(rawId) : slugify(name);
    if (id === "") {
      issues.push({
        line,
        message: `"${name}" — can't build an id from that name; add an id column.`,
      });
      continue;
    }

    const duplicateOf = seenInFile.get(id);
    if (duplicateOf !== undefined) {
      issues.push({
        line,
        message: `"${name}" — id "${id}" is already used on line ${duplicateOf}. Ids must be unique.`,
      });
      continue;
    }

    const rawCategory = cellAt(row, "category");
    let categoryId = "";
    if (rawCategory !== "") {
      const resolved = categoryLookup.get(rawCategory.toLowerCase());
      if (!resolved) {
        issues.push({
          line,
          message: `"${name}" — unknown category "${rawCategory}". Create the category first, or leave the cell blank.`,
        });
        continue;
      }
      categoryId = resolved;
    }

    const homeownerPrice = parseMoney(cellAt(row, "homeownerPrice"));
    if (homeownerPrice === null) {
      issues.push({ line, message: `"${name}" — missing or unreadable price.` });
      continue;
    }
    if (homeownerPrice < 0) {
      issues.push({ line, message: `"${name}" — price can't be negative.` });
      continue;
    }

    // Trade price is optional: without one the trade pays retail, which
    // is the safe default. Never silently discount.
    const contractorPrice =
      parseMoney(cellAt(row, "contractorPrice")) ?? homeownerPrice;
    if (contractorPrice < 0) {
      issues.push({
        line,
        message: `"${name}" — trade price can't be negative.`,
      });
      continue;
    }

    const stockRaw = parseMoney(cellAt(row, "stockQuantity"));
    const stockQuantity = stockRaw === null ? 0 : Math.floor(stockRaw);
    if (stockQuantity < 0) {
      issues.push({ line, message: `"${name}" — stock can't be negative.` });
      continue;
    }

    const thresholdRaw = parseMoney(cellAt(row, "lowStockThreshold"));
    const lowStockThreshold =
      thresholdRaw === null ? 10 : Math.max(0, Math.floor(thresholdRaw));

    seenInFile.set(id, line);
    rows.push({
      line,
      isNew: !known.has(id),
      input: {
        id,
        name,
        brand: cellAt(row, "brand"),
        categoryId,
        homeownerPrice,
        contractorPrice,
        unit: cellAt(row, "unit") || "each",
        stockQuantity,
        lowStockThreshold,
        description: cellAt(row, "description"),
        imageUrl: cellAt(row, "imageUrl"),
        isActive: parseBool(cellAt(row, "isActive"), true),
      },
    });
  }

  return { rows, issues, unknownColumns };
}

/**
 * Writes a planned import.
 *
 * Chunked rather than one giant upsert, so a 500-row sheet doesn't build
 * a request large enough to be rejected, and so a failure can name where
 * it stopped. stock_status is never sent — a trigger derives it from the
 * quantity, exactly as upsertProduct does.
 */
export async function commitProductImport(
  rows: { input: AdminProductInput }[],
): Promise<ServiceResult<{ written: number }>> {
  if (rows.length === 0) return fail("There's nothing to import.");

  const supabase = createClient();
  const CHUNK = 100;
  let written = 0;

  for (let start = 0; start < rows.length; start += CHUNK) {
    const slice = rows.slice(start, start + CHUNK);
    const base = slice.map(({ input }) => ({
      id: input.id,
      name: input.name.trim(),
      slug: input.id,
      brand: input.brand.trim(),
      category_id: input.categoryId || null,
      price: input.homeownerPrice,
      homeowner_price: input.homeownerPrice,
      contractor_price: input.contractorPrice,
      unit: input.unit,
      stock_quantity: input.stockQuantity,
      description: input.description.trim(),
      image_url: input.imageUrl.trim() || null,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    }));

    // low_stock_threshold is retried away if schema-07 hasn't been
    // applied, matching upsertProduct.
    let { error } = await supabase.from("products").upsert(
      base.map((row, i) => ({
        ...row,
        low_stock_threshold: slice[i].input.lowStockThreshold,
      })),
    );
    if (error) ({ error } = await supabase.from("products").upsert(base));

    if (error) {
      console.error("[commitProductImport]", error);
      const detail = toUserMessage(error, "the database rejected it.");
      return fail(
        written > 0
          ? `${written} product${written === 1 ? "" : "s"} imported, then the next batch failed: ${detail}`
          : detail,
      );
    }
    written += slice.length;
  }

  return ok({ written });
}

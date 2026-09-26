"use client";

import * as React from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/shared/toast";
import {
  uploadProductImage,
  upsertProduct,
  type AdminCategoryRow,
  type AdminProductRow,
} from "@/services/admin";

const UNITS = ["each", "piece", "sheet", "bag", "sq ft", "ft", "bundle", "gallon"];

/** Slug-safe id derived from the name, for new products only. */
function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const BLANK: AdminProductRow = {
  id: "",
  name: "",
  brand: "",
  categoryId: "",
  homeownerPrice: 0,
  contractorPrice: 0,
  unit: "each",
  stockQuantity: 0,
  stockStatus: "in-stock",
  lowStockThreshold: 10,
  trackStock: true,
  description: "",
  imageUrl: "",
  isActive: true,
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null means "create new". */
  product: AdminProductRow | null;
  categories: AdminCategoryRow[];
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {/* Keyed so switching rows remounts with fresh initial state,
            rather than syncing props into state inside an effect. */}
        <ProductForm
          key={product?.id ?? "new"}
          product={product}
          categories={categories}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: AdminProductRow | null;
  categories: AdminCategoryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<AdminProductRow>(product ?? BLANK);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const isEdit = Boolean(product);

  async function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires.
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const result = await uploadProductImage(file);
    setUploading(false);

    if (result.ok) {
      set("imageUrl", result.data);
    } else {
      toast(result.error, "error");
    }
  }

  function set<K extends keyof AdminProductRow>(
    key: K,
    value: AdminProductRow[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = isEdit ? form.id : form.id.trim() || toId(form.name);
    if (!id) {
      toast("Enter a product name first.", "error");
      return;
    }

    setSaving(true);
    const result = await upsertProduct({
      id,
      name: form.name,
      brand: form.brand,
      categoryId: form.categoryId,
      homeownerPrice: form.homeownerPrice,
      contractorPrice: form.contractorPrice,
      unit: form.unit,
      stockQuantity: form.stockQuantity,
      lowStockThreshold: form.lowStockThreshold,
      trackStock: form.trackStock,
      stockStatus: form.stockStatus,
      description: form.description,
      imageUrl: form.imageUrl,
      isActive: form.isActive,
    });
    setSaving(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    toast(isEdit ? "Product updated" : "Product created");
    onClose();
    onSaved();
  }

  return (
    <>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>

        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
            {!isEdit && form.name ? (
              <p className="text-xs text-muted-foreground">
                ID: <code>{form.id.trim() || toId(form.name)}</code>
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-brand">Brand</Label>
              <Input
                id="product-brand"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-category">Category</Label>
              <select
                id="product-category"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-retail">Retail price (CAD)</Label>
              <Input
                id="product-retail"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.homeownerPrice}
                onChange={(e) =>
                  set("homeownerPrice", Number(e.target.value))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-trade">Trade price (CAD)</Label>
              <Input
                id="product-trade"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.contractorPrice}
                onChange={(e) =>
                  set("contractorPrice", Number(e.target.value))
                }
                required
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            These are the only prices an order can charge — the database
            overwrites whatever a client sends with the value for the buyer&apos;s
            role.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-unit">Unit</Label>
              <select
                id="product-unit"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            {form.trackStock ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product-stock-qty">Stock qty</Label>
                  <Input
                    id="product-stock-qty"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.stockQuantity}
                    onChange={(e) =>
                      set("stockQuantity", Number(e.target.value))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product-low-stock">Warn me at</Label>
                  <Input
                    id="product-low-stock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.lowStockThreshold}
                    onChange={(e) =>
                      set("lowStockThreshold", Number(e.target.value))
                    }
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="product-availability">Availability</Label>
                <select
                  id="product-availability"
                  value={form.stockStatus}
                  onChange={(e) => set("stockStatus", e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
                >
                  <option value="in-stock">In stock</option>
                  <option value="low-stock">Running low</option>
                  <option value="out-of-stock">Out of stock</option>
                </select>
              </div>
            )}
          </div>

          {/* Most of the catalogue is stocked by a supplier and never
              counted here. Forcing a number on those products is what
              put all 3,405 of them out of stock in the first place. */}
          <label className="-mt-2 flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.trackStock}
              onChange={(e) => set("trackStock", e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>
              Count this product
              <span className="block text-xs text-muted-foreground">
                {form.trackStock
                  ? "Availability follows the count: zero is out of stock, anything at or below “warn me at” shows as running low."
                  : "Availability is whatever you set above, and stays there until you change it."}
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {form.imageUrl ? (
                  // Plain img to match EditorialImage: these are remote
                  // Supabase URLs and next/image would need the host
                  // allow-listed for no benefit at 80px.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-6" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="press"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-3.5" />
                        {form.imageUrl ? "Replace" : "Upload"}
                      </>
                    )}
                  </Button>
                  {form.imageUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="press"
                      onClick={() => set("imageUrl", "")}
                    >
                      <X className="size-3.5" /> Remove
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or WebP, up to 5 MB. Shown in the shop.
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImage}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="size-4 accent-primary"
            />
            <span>Active — visible in the catalog and orderable</span>
          </label>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create product"
            )}
          </Button>
        </DialogFooter>
    </>
  );
}

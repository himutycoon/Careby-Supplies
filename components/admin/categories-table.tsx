"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { Icon } from "@/components/shared/icon";
import { useToast } from "@/components/shared/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAsyncData } from "@/lib/store/hooks";
import {
  deleteCategory,
  getAllCategoriesForAdmin,
  setCategoryActive,
  upsertCategory,
  type AdminCategoryRow,
} from "@/services/admin";

/** Icon names the shared <Icon> registry already knows. */
const ICON_CHOICES = [
  "Boxes",
  "Ruler",
  "Wrench",
  "Home",
  "Building2",
  "Package",
  "Palette",
  "AlertTriangle",
  "ShoppingCart",
  "FileUp",
];

const BLANK: AdminCategoryRow = {
  id: "",
  name: "",
  slug: "",
  icon: "Boxes",
  sortOrder: 0,
  isActive: true,
};

function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function CategoriesTable() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(
    getAllCategoriesForAdmin,
  );
  const categories = data ?? [];

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<AdminCategoryRow>(BLANK);
  const [isEdit, setIsEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<AdminCategoryRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteCategory(deleting.id);
    setDeletePending(false);
    setDeleting(null);

    if (result.ok) {
      toast("Category deleted");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  function openNew() {
    setForm({ ...BLANK, sortOrder: categories.length + 1 });
    setIsEdit(false);
    setDialogOpen(true);
  }

  function openEdit(category: AdminCategoryRow) {
    setForm(category);
    setIsEdit(true);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = isEdit ? form.id : form.id.trim() || toId(form.name);
    if (!id) {
      toast("Enter a category name first.", "error");
      return;
    }

    setSaving(true);
    const result = await upsertCategory({
      id,
      name: form.name,
      icon: form.icon,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    });
    setSaving(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    toast(isEdit ? "Category updated" : "Category created");
    setDialogOpen(false);
    reload();
  }

  async function toggleActive(id: string, next: boolean) {
    setPendingId(id);
    const result = await setCategoryActive(id, next);
    setPendingId(null);

    if (result.ok) {
      toast(next ? "Category shown" : "Category hidden");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load categories"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button className="press w-full sm:w-auto" onClick={openNew}>
          <Plus className="size-4" /> New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="Boxes"
          title="No categories yet"
          description="Categories group the catalog for shoppers."
          action={<Button onClick={openNew}>New category</Button>}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background sm:gap-3 sm:divide-y-0 sm:border-0 sm:bg-transparent">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-2.5 px-3 py-2.5 sm:rounded-xl sm:border sm:border-border sm:bg-background sm:p-4"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10">
                <Icon name={category.icon} className="size-4 sm:size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold sm:text-base">
                  <span className="truncate">{category.name}</span>
                  {!category.isActive ? (
                    <Badge
                      variant="destructive"
                      className="shrink-0 px-1.5 py-0 text-[10px]"
                    >
                      Hidden
                    </Badge>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {category.id} · position {category.sortOrder}
                </p>
              </div>

              <Button
                size="icon-sm"
                variant="outline"
                className="press shrink-0"
                aria-label={`Edit ${category.name}`}
                onClick={() => openEdit(category)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant={category.isActive ? "outline" : "default"}
                className="press shrink-0"
                disabled={pendingId === category.id}
                onClick={() => toggleActive(category.id, !category.isActive)}
              >
                {category.isActive ? "Hide" : "Show"}
              </Button>
              <Button
                size="icon-sm"
                variant="destructive"
                className="press shrink-0"
                aria-label={`Delete ${category.name}`}
                onClick={() => setDeleting(category)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit category" : "New category"}
            </DialogTitle>
          </DialogHeader>

          <form
            id="category-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) =>
                  setForm((c) => ({ ...c, name: e.target.value }))
                }
                required
              />
              {!isEdit && form.name ? (
                <p className="text-xs text-muted-foreground">
                  ID: <code>{form.id.trim() || toId(form.name)}</code>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category-icon">Icon</Label>
              <select
                id="category-icon"
                value={form.icon}
                onChange={(e) =>
                  setForm((c) => ({ ...c, icon: e.target.value }))
                }
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:h-8"
              >
                {ICON_CHOICES.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category-order">Position</Label>
              <Input
                id="category-order"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((c) => ({ ...c, sortOrder: Number(e.target.value) }))
                }
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((c) => ({ ...c, isActive: e.target.checked }))
                }
                className="size-4 accent-primary"
              />
              <span>Visible to shoppers</span>
            </label>
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" form="category-form" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="Categories still in use by products can't be deleted — hide those instead so the catalog keeps working."
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

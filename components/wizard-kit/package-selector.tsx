import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PackageTier } from "@/data/project-flows";

/** Optional service-package picker, shared by every project flow. */
export function PackageSelector({
  tiers,
  value,
  onChange,
}: {
  tiers: PackageTier[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tiers.map((tier) => (
        <label
          key={tier.id}
          className={cn(
            "flex cursor-pointer flex-col gap-1.5 rounded-xl border p-4 transition-colors",
            value === tier.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40",
          )}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                name="package-tier"
                value={tier.id}
                checked={value === tier.id}
                onChange={() => onChange(tier.id)}
                className="size-4 accent-primary"
              />
              <span className="font-medium">{tier.name}</span>
            </span>
            <span className="text-sm font-semibold">
              {tier.priceCad === null ? "—" : formatCad(tier.priceCad)}
            </span>
          </span>
          <span className="pl-6.5 text-sm text-muted-foreground">
            {tier.description}
          </span>
        </label>
      ))}
    </div>
  );
}

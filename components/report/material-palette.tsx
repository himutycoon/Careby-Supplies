import type { MaterialSwatch } from "@/data/mock";

export function MaterialPalette({ swatches }: { swatches: MaterialSwatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {swatches.map((swatch) => (
        <div key={swatch.name} className="flex flex-col gap-2">
          <div
            className="aspect-square w-full rounded-md border border-border"
            style={{ backgroundColor: swatch.hex }}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium">{swatch.name}</p>
            <p className="text-xs text-muted-foreground">{swatch.category}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

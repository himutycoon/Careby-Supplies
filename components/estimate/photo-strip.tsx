import { PhotoPlaceholder } from "@/components/shared/photo-placeholder";

export function PhotoStrip({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <PhotoPlaceholder key={i} label={`Photo ${i + 1}`} tone="before" />
      ))}
    </div>
  );
}

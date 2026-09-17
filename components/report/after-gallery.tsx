import { PhotoPlaceholder } from "@/components/shared/photo-placeholder";

export function AfterGallery({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <PhotoPlaceholder
          key={i}
          label={`Concept ${i + 1}`}
          tone="after"
        />
      ))}
    </div>
  );
}

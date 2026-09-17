import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardStepProps } from "@/components/wizard/wizard-types";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 8;

export function StepPhotos({ state, update }: WizardStepProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - state.photos.length;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
      }));
    if (next.length > 0) {
      update("photos", [...state.photos, ...next]);
    }
  }

  function removePhoto(id: string) {
    update(
      "photos",
      state.photos.filter((photo) => photo.id !== id),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Upload photos</h2>
        <p className="text-sm text-muted-foreground">
          Add {MIN_PHOTOS}–{MAX_PHOTOS} photos of the room. Wider shots that
          show fixtures and finishes work best.
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
        )}
      >
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag and drop photos here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          {state.photos.length} of {MAX_PHOTOS} photos added
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </button>

      {state.photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {state.photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-4/3 overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={photo.name}
                className="size-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removePhoto(photo.id)}
                aria-label={`Remove ${photo.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {state.photos.length > 0 && state.photos.length < MIN_PHOTOS ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Add at least {MIN_PHOTOS} photos to continue.
        </p>
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
}

export function AfterImageUpload({
  onFilesChange,
}: {
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = React.useState<UploadedImage[]>([]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
      }));
    if (next.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...next];
        onFilesChange(updated.map((i) => i.file));
        return updated;
      });
    }
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      onFilesChange(updated.map((i) => i.file));
      return updated;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50"
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Upload concept &quot;after&quot; images</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </button>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-4/3 overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt={image.name}
                className="size-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(image.id)}
                aria-label={`Remove ${image.name}`}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkDeliveredButton({
  alreadyDelivered = false,
  onDeliver,
}: {
  alreadyDelivered?: boolean;
  onDeliver: () => Promise<{ ok: true } | { error: string }>;
}) {
  const [delivered, setDelivered] = React.useState(alreadyDelivered);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await onDeliver();
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDelivered(true);
  }

  if (delivered) {
    return (
      <Button disabled className="bg-green-600 text-white opacity-100 dark:bg-green-500">
        <CheckCircle2 className="size-4" /> Delivered
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-3.5" /> {error}
        </p>
      ) : null}
      <Button size="lg" onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Delivering…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" /> Mark delivered
          </>
        )}
      </Button>
    </div>
  );
}

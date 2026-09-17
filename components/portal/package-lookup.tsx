"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPackageByReference } from "@/services/packages";

export function PackageLookup() {
  const router = useRouter();
  const [id, setId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = id.trim().toUpperCase();

    if (!trimmed) {
      setError("Enter your package ID.");
      return;
    }

    setChecking(true);
    setError(null);
    const pkg = await getPackageByReference(trimmed);
    setChecking(false);

    if (!pkg) {
      setError("We couldn't find a package with that ID.");
      return;
    }

    router.push(`/customer/package/${pkg.id}`);
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="package-id">Package ID</Label>
        <Input
          id="package-id"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            if (error) setError(null);
          }}
          placeholder="PKG-A1B2C3"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "package-id-error" : undefined}
        />
        {error ? (
          <p
            id="package-id-error"
            role="alert"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={checking}>
        {checking ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Looking up…
          </>
        ) : (
          <>
            Open my project <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

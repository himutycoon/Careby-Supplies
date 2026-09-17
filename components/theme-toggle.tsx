"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

/**
 * True only after the client has hydrated. Server and the client's first
 * render both use getServerSnapshot (false), so this can never mismatch —
 * unlike checking `resolvedTheme`, which next-themes can resolve
 * synchronously from localStorage on the client's very first paint.
 */
function useMounted() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="size-4.5" />
      ) : (
        <Moon className="size-4.5" />
      )}
    </Button>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Icon } from "@/components/shared/icon";
import { createClient } from "@/lib/supabase/client";
import { userTypeStore } from "@/lib/store/app-store";
import { GUIDED_FLOWS, type GuidedFlowOption } from "@/data/guided-flows";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type PickableRole = Exclude<UserRole, "admin">;

const ROLES: { id: PickableRole; label: string; icon: string }[] = [
  { id: "homeowner", label: "I'm a Homeowner", icon: "Home" },
  { id: "contractor", label: "I'm a Contractor", icon: "HardHat" },
];

/**
 * Role switcher + flow picker.
 *
 * The role control sits at the top and is always visible, rather than
 * being a full screen of its own: on a phone that first screen was pure
 * navigation cost, and defaulting to homeowner means the options are
 * on-screen immediately for the common case.
 *
 * Every destination is an existing, database-backed flow — this only
 * decides where to send you.
 */
export function GuidedFlowRouter() {
  const router = useRouter();
  const [role, setRole] = React.useState<PickableRole>("homeowner");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [signedInRole, setSignedInRole] = React.useState<UserRole | null>(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setChecking(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const found = (data?.role as UserRole) ?? "homeowner";
      setSignedInRole(found);
      if (found === "contractor") setRole("contractor");
      setChecking(false);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  function choose(option: GuidedFlowOption) {
    setPendingId(option.id);
    userTypeStore.set(role);

    // Signed in with the matching role (or admin, who sees everything):
    // straight through. Otherwise sign up first and come back here.
    if (signedInRole === role || signedInRole === "admin") {
      router.push(option.href);
      return;
    }
    router.push(`/signup?role=${role}&next=${encodeURIComponent(option.href)}`);
  }

  if (checking) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const options = GUIDED_FLOWS[role];
  // A signed-in homeowner has no use for the contractor paths, and vice
  // versa — only admins and signed-out visitors get the switch.
  const canSwitch = signedInRole === null || signedInRole === "admin";

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-6">
      {canSwitch ? (
        <div
          className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1.5"
          role="tablist"
          aria-label="Choose your account type"
        >
          {ROLES.map((option) => {
            const active = role === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRole(option.id)}
                className={cn(
                  "press flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon name={option.icon} className="size-4 shrink-0" />
                {/* Phones only have room for the noun. */}
                <span className="sm:hidden">
                  {option.id === "homeowner" ? "Homeowner" : "Contractor"}
                </span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={pendingId !== null}
            onClick={() => choose(option)}
            className={cn(
              "press group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/40 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-col sm:items-start sm:gap-3 sm:p-5 sm:hover:-translate-y-1",
              pendingId !== null && pendingId !== option.id && "opacity-60",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-11 sm:rounded-xl">
              <Icon name={option.icon} className="size-5" />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1.5">
              <span className="text-sm font-semibold sm:text-lg sm:font-medium">
                {option.label}
              </span>
              {/* One line on a phone, full description from sm up. */}
              <span className="line-clamp-1 text-xs text-muted-foreground sm:line-clamp-none sm:text-sm">
                {option.description}
              </span>
            </span>

            {/* The step preview is desktop-only — on a phone it competed
                with the options themselves for space. */}
            <span className="hidden flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:flex">
              {option.steps.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-border">
                      ›
                    </span>
                  ) : null}
                  {step}
                </span>
              ))}
            </span>

            {pendingId === option.id ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-primary sm:hidden" />
            ) : (
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground sm:hidden"
                aria-hidden="true"
              />
            )}

            <span className="mt-auto hidden items-center gap-1.5 pt-2 text-sm font-medium text-primary sm:inline-flex">
              {pendingId === option.id ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Opening…
                </>
              ) : (
                <>
                  Start <ArrowRight className="size-3.5" />
                </>
              )}
            </span>
          </button>
        ))}
      </div>

      {signedInRole === null ? (
        <p className="text-xs text-muted-foreground sm:text-sm">
          You&apos;ll create an account first — we&apos;ll bring you straight
          back to the path you picked.
        </p>
      ) : null}
    </div>
  );
}

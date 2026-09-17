"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Menu,
  Receipt,
  Search,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { CartButton } from "@/components/shop/cart-button";
import { createClient } from "@/lib/supabase/client";
import { homeForRole } from "@/lib/supabase/profile";
import { NAV_LINKS } from "@/data/mock";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  // null = still checking, so we don't flash "Login" at a signed-in user.
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [signedIn, setSignedIn] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setRole((data?.role as UserRole) ?? "homeowner");
      setSignedIn(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const home = homeForRole(role ?? "homeowner");

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = term.trim();
    router.push(
      query ? `/products?q=${encodeURIComponent(query)}#catalog` : "/products",
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:h-18 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Catalog search in the header, the way a supply store works:
            a shopper who knows the part shouldn't have to find the shop
            page first. Below xl there isn't room beside the nav links,
            so it collapses to the icon that has always been here. */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="hidden min-w-0 flex-1 xl:block xl:max-w-xs"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search materials, tools, SKU..."
              aria-label="Search products"
              className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm transition-colors hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
          </div>
        </form>

        <div className="hidden items-center gap-1 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search products"
            className="xl:hidden"
            render={
              <Link href="/products#catalog">
                <Search className="size-4.5" />
              </Link>
            }
          />
          <CartButton />
          <ThemeToggle />

          {/*
            Account menu, not a bare link: signed-in users still need
            their dashboard, but it is no longer the public primary CTA —
            a shopper landing here wants a quote, not an admin console.
          */}
          {signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="press">
                    <User className="size-4" /> Account
                    <ChevronDown className="size-3.5 opacity-60" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem
                  render={
                    <Link href={home}>
                      <LayoutDashboard className="size-4" /> Dashboard
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/orders">
                      <Receipt className="size-4" /> My orders
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/account">
                      <Settings className="size-4" /> Account settings
                    </Link>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="press"
              render={<Link href="/login">Log in</Link>}
            />
          )}

          {/* The one hi-vis button in the header — the conversion
              action, not the account or cart controls. */}
          <Button
            variant="hi-vis"
            className="press ml-1"
            render={<Link href="/contact?about=quote">Get a Quote</Link>}
          />
        </div>

        {/* Cart lives in the bottom tab bar on phones — top-right is the
            hardest spot on the screen for a thumb, and duplicating it
            here would just crowd the header. */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            {/* w-80 overflowed the narrowest phones; cap by viewport. */}
            <SheetContent side="right" className="w-[85vw] max-w-xs">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="press flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-5 flex flex-col gap-2 border-t border-border px-4 pt-5">
                <Button
                  variant="hi-vis"
                  size="lg"
                  className="press"
                  render={
                    <Link href="/contact" onClick={() => setOpen(false)}>
                      Get a Quote
                    </Link>
                  }
                />

                {signedIn ? (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="press"
                      render={
                        <Link href={home} onClick={() => setOpen(false)}>
                          Dashboard
                        </Link>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="lg"
                      className="press"
                      render={
                        <Link href="/orders" onClick={() => setOpen(false)}>
                          My orders
                        </Link>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="lg"
                      className="press"
                      render={
                        <Link href="/account" onClick={() => setOpen(false)}>
                          Account settings
                        </Link>
                      }
                    />
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="press"
                      render={
                        <Link href="/login" onClick={() => setOpen(false)}>
                          Log in
                        </Link>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="lg"
                      className="press"
                      render={
                        <Link href="/get-started" onClick={() => setOpen(false)}>
                          Create an account
                        </Link>
                      }
                    />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/*
        Search gets its own row below the logo on phones, the way every
        supply app does it. The xl inline field has no room here, and a
        shopper should not have to open a menu — or scroll past the
        hero — to search the catalogue.

        Except on the catalogue itself, which carries its own search that
        filters as you type. Stacking two near-identical fields a
        hundred pixels apart reads as a bug.
      */}
      <div
        className={cn(
          "border-t border-border/60 px-4 pb-2.5 sm:px-6 xl:hidden",
          pathname === "/products" && "hidden",
        )}
      >
        <form onSubmit={handleSearch} role="search" className="relative mt-2.5">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search materials, tools, SKU..."
            aria-label="Search products"
            className="h-10 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-base transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:text-sm"
          />
        </form>
      </div>
    </header>
  );
}

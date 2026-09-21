"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/shop/cart-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { CatalogSearch } from "@/components/shop/catalog-search";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface AppTopNavLink {
  label: string;
  href: string;
  icon: string;
}

// Icon components can't cross the server → client boundary as prop values
// (only rendered elements can), so layouts pass icon names and we resolve
// them here — same pattern as data/mock.ts's icon-string fields.
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Plus,
};

export function AppTopNav({
  links,
  homeHref,
  showSearch = false,
}: {
  links: AppTopNavLink[];
  homeHref: string;
  /** Dashboard shells show a search field instead of a link row. */
  showSearch?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div
        className={cn(
          "flex h-18 items-center justify-between gap-4 px-4 sm:px-6",
          showSearch ? "w-full lg:px-6" : "mx-auto max-w-6xl",
        )}
      >
        <Logo />

        {showSearch ? (
          /* Was a bare <Input> with no form and no handler: typing and
             pressing Enter did nothing, on every contractor screen. It
             also promised to search orders, which nothing ever did. Now
             the same working catalogue search as the public header. */
          <CatalogSearch
            className="hidden max-w-md flex-1 sm:block"
            placeholder="Search materials, tools, SKU..."
          />
        ) : (
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const Icon = ICONS[link.icon] ?? LayoutDashboard;
              return (
                <Button
                  key={link.href}
                  variant="ghost"
                  className={cn(
                    pathname.startsWith(link.href) &&
                      "bg-muted text-foreground",
                  )}
                  render={
                    <Link href={link.href}>
                      <Icon className="size-4" />
                      {link.label}
                    </Link>
                  }
                />
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <CartButton />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Avatar>
                <AvatarFallback>
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Grouped so the email labels the account links for screen
                  readers — and because Base UI's group label throws when
                  it has no group to attach to. */}
              <DropdownMenuGroup>
                {email ? (
                  <>
                    <DropdownMenuGroupLabel className="truncate font-normal text-foreground">
                      {email}
                    </DropdownMenuGroupLabel>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem
                  render={
                    <Link href={homeHref}>
                      <LayoutDashboard /> Home
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/account">
                      <User /> Account
                    </Link>
                  }
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dashboard shells use MobileTabBar instead of this row. */}
      <nav
        className={cn(
          "items-center gap-1 border-t border-border px-4 py-2 sm:hidden",
          links.length === 0 ? "hidden" : "flex",
        )}
      >
        {links.map((link) => {
          const Icon = ICONS[link.icon] ?? LayoutDashboard;
          return (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1",
                pathname.startsWith(link.href) && "bg-muted text-foreground",
              )}
              render={
                <Link href={link.href}>
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              }
            />
          );
        })}
      </nav>
    </header>
  );
}

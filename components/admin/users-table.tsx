"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getUsers, updateUserRole } from "@/services/admin";
import { formatDate } from "@/lib/format";

const ROLES = ["homeowner", "contractor", "admin"];

export function UsersTable() {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error, reload } = useAsyncData(
    () => getUsers(debounced),
    [debounced],
  );

  async function changeRole(userId: string, role: string) {
    setPendingId(userId);
    const result = await updateUserRole(userId, role);
    setPendingId(null);

    if (result.ok) {
      toast("Role updated");
      reload();
    } else {
      toast(result.error, "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search users"
          className="pl-9 md:pl-9"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon="AlertTriangle"
          title="Couldn't load users"
          description={error}
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon="UserCheck"
          title={search ? "No users match that search" : "No users yet"}
          description={
            search
              ? "Try a different name or email."
              : "Accounts appear here as people sign up."
          }
        />
      ) : (
        <>
          {/* Phones get cards; the role control needs a full-width tap
              target rather than a cramped cell at the end of a row. */}
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-background lg:hidden">
            {(data ?? []).map((user) => (
              <li key={user.id} className="flex flex-col gap-1.5 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {user.fullName || user.email}
                  </p>
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-1.5 py-0 text-[10px] capitalize"
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email} · joined {formatDate(user.createdAt)}
                </p>
                <select
                  value={user.role}
                  disabled={pendingId === user.id}
                  onChange={(e) => changeRole(user.id, e.target.value)}
                  aria-label={`Change role for ${user.email}`}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs capitalize focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-border bg-background lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Change role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.fullName || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <select
                      value={user.role}
                      disabled={pendingId === user.id}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      aria-label={`Change role for ${user.email}`}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs capitalize focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </>
      )}
    </div>
  );
}

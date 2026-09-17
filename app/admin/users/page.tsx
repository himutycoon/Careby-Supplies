import type { Metadata } from "next";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = { title: "Users — CareBy Admin" };

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Every account on the platform, and what role it holds.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}

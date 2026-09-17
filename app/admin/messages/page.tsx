import type { Metadata } from "next";
import { AdminRecordTable } from "@/components/admin/admin-record-table";

export const metadata: Metadata = { title: "Messages — CareBy Admin" };

export default function AdminMessagesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Everything sent from the contact form — including the &ldquo;Talk
          to an Expert&rdquo;, consultation and support links across the
          site.
        </p>
      </div>
      <AdminRecordTable
        source="messages"
        table="contact_messages"
        statuses={["new", "reading", "replied", "closed"]}
        columnLabels={{
          reference: "Reference",
          label: "From",
          sublabel: "Subject",
        }}
        emptyTitle="No messages"
        emptyDescription="Messages sent from the contact form appear here."
      />
    </div>
  );
}

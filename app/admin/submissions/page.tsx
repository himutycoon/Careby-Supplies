import type { Metadata } from "next";
import { QueueTable } from "@/components/admin/queue-table";
import { getAllRealSubmissions } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = { title: "Submission Queue — CareBy Admin" };

export default async function AdminQueuePage() {
  // Real rows only — padding the queue with mock submissions made the
  // admin screen look busy while hiding how many real jobs were waiting.
  const submissions = await getAllRealSubmissions();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submission queue</h1>
        <p className="text-muted-foreground">
          Review submissions and deliver checked material plans.
        </p>
      </div>
      <QueueTable submissions={submissions} />
    </div>
  );
}

import { PageHeader } from "@/components/shared/page-header";

export default function FarmerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Farmer Operations & Produce Origin"
        subheading="Register harvest batches, dispatch cold-chain shipments, and monitor pickup schedules."
      />
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Harvester Hub Overview</h3>
        <p className="mt-1 text-xs text-slate-500">
          Manage farm dispatch queues and verify packaging temperature standards.
        </p>
      </div>
    </div>
  );
}

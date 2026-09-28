import { PageHeader } from "@/components/shared/page-header";

export default function WarehousePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Warehouse Cold-Storage Hub"
        subheading="Inspect incoming refrigerated trucks, verify seal integrity, and stage storage vaults."
      />
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Vault & Intake Management</h3>
        <p className="mt-1 text-xs text-slate-500">
          Monitor multi-zone ambient refrigeration metrics and inventory holding pipelines.
        </p>
      </div>
    </div>
  );
}

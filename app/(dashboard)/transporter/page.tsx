import { PageHeader } from "@/components/shared/page-header";

export default function TransporterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Transporter Telemetry & Route Management"
        subheading="Real-time reefers tracking, GPS routing, and cold-box status verification."
      />
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Fleet Dispatch Center</h3>
        <p className="mt-1 text-xs text-slate-500">
          Monitor moving vehicles and handle geofence ingress/egress events.
        </p>
      </div>
    </div>
  );
}

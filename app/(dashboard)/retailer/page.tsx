"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { ReportExportBar } from "@/components/features/reports/report-export-bar";
import { useAllShipmentsQuery } from "@/lib/hooks/use-shipments-query";
import { downloadDeliverySummaryCsv, downloadQualityAuditPdf, downloadReceiptCsv, downloadShipmentPdf } from "@/lib/utils/report-exports";
import { toast } from "@/stores/toast.store";
import {
  Package, CheckCircle, AlertTriangle, TrendingUp,
  FileText, Download, ShieldCheck, Clock, Thermometer,
} from "lucide-react";

// ── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, color = "green",
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: "green" | "blue" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Mock Analytics Data ───────────────────────────────────────
const DELIVERY_TREND = [
  { week: "Week 1", onTime: 12, delayed: 3, failed: 1 },
  { week: "Week 2", onTime: 18, delayed: 2, failed: 0 },
  { week: "Week 3", onTime: 14, delayed: 5, failed: 2 },
  { week: "Week 4", onTime: 22, delayed: 1, failed: 0 },
  { week: "Week 5", onTime: 19, delayed: 4, failed: 1 },
  { week: "Week 6", onTime: 25, delayed: 2, failed: 0 },
];

const SUPPLY_LOSS = [
  { produce: "Mangoes", loss: 6.2 },
  { produce: "Tomatoes", loss: 8.5 },
  { produce: "Wheat", loss: 2.1 },
  { produce: "Rice", loss: 1.8 },
  { produce: "Cotton", loss: 1.1 },
  { produce: "Potatoes", loss: 3.4 },
  { produce: "Kinnow", loss: 4.7 },
  { produce: "Onions", loss: 2.9 },
];

const TEMP_VARIANCE = [
  { time: "00:00", actual: 3.8, target: 4.0 },
  { time: "04:00", actual: 4.1, target: 4.0 },
  { time: "08:00", actual: 5.2, target: 4.0 },
  { time: "12:00", actual: 6.8, target: 4.0 },
  { time: "16:00", actual: 5.5, target: 4.0 },
  { time: "20:00", actual: 4.2, target: 4.0 },
  { time: "Now", actual: 3.9, target: 4.0 },
];

const PRODUCE_MIX = [
  { name: "Wheat", value: 28, color: "#f59e0b" },
  { name: "Rice", value: 22, color: "#22c55e" },
  { name: "Mangoes", value: 18, color: "#f97316" },
  { name: "Cotton", value: 15, color: "#a3e635" },
  { name: "Tomatoes", value: 10, color: "#ef4444" },
  { name: "Others", value: 7, color: "#94a3b8" },
];

const RECENT_RECEIPTS = [
  { id: "SHP-001", produce: "Wheat", qty: "500 kg", from: "Sargodha Farm A", temp: "3.8°C", status: "accepted", date: "29 Sep 2026" },
  { id: "SHP-002", produce: "Tomatoes", qty: "300 kg", from: "Multan Farm 3", temp: "6.1°C", status: "accepted", date: "28 Sep 2026" },
  { id: "SHP-003", produce: "Mangoes", qty: "800 kg", from: "Bahawalpur Farm", temp: "12.5°C", status: "rejected", date: "28 Sep 2026" },
  { id: "SHP-004", produce: "Rice", qty: "1200 kg", from: "Gujranwala Farm", temp: "3.9°C", status: "accepted", date: "27 Sep 2026" },
  { id: "SHP-005", produce: "Cotton", qty: "2000 kg", from: "Vehari Farm", temp: "N/A", status: "pending", date: "27 Sep 2026" },
];

const STATUS_STYLES: Record<string, string> = {
  accepted: "badge-green",
  rejected: "badge-red",
  pending: "badge-yellow",
};

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((e: any) => (
        <p key={e.name} style={{ color: e.color }}>
          {e.name}: <strong>{e.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function RetailerPage() {
  const { data, isLoading } = useAllShipmentsQuery();
  const shipments = data?.items ?? [];
  const [activeTab, setActiveTab] = useState<"overview" | "receipts" | "reports">("overview");
  const [exporting, setExporting] = useState<string | null>(null);

  const accepted = RECENT_RECEIPTS.filter((r) => r.status === "accepted").length;
  const rejected = RECENT_RECEIPTS.filter((r) => r.status === "rejected").length;
  const pending = RECENT_RECEIPTS.filter((r) => r.status === "pending").length;
  const avgLoss = (SUPPLY_LOSS.reduce((a, b) => a + b.loss, 0) / SUPPLY_LOSS.length).toFixed(1);
  const exportRetailReport = async (report: "receipt-csv" | "compliance-pdf" | "quality-pdf" | "delivery-csv") => {
    try {
      setExporting(report);
      if (report === "receipt-csv") await downloadReceiptCsv(RECENT_RECEIPTS);
      if (report === "compliance-pdf") await downloadShipmentPdf(shipments, "Compliance Report");
      if (report === "quality-pdf") await downloadQualityAuditPdf(shipments, RECENT_RECEIPTS);
      if (report === "delivery-csv") await downloadDeliverySummaryCsv(RECENT_RECEIPTS);
      toast.success("Report downloaded", "Your report is ready.");
    } catch (error) {
      console.error("Failed to generate retailer report", error);
      toast.error("Report download failed", "Please try again.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <PageHeader
        heading="Retailer Receiving & Quality Verification"
        subheading="Track incoming produce, verify cold-chain compliance, and generate receipt reports."
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Received"
          value={isLoading ? "…" : shipments.length || 8}
          sub="All shipments"
          icon={<Package className="h-4 w-4" />}
          color="blue"
        />
        <StatCard
          label="Accepted"
          value={accepted}
          sub="Passed quality check"
          icon={<CheckCircle className="h-4 w-4" />}
          color="green"
        />
        <StatCard
          label="Rejected"
          value={rejected}
          sub="Failed compliance"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="red"
        />
        <StatCard
          label="Avg Supply Loss"
          value={`${avgLoss}%`}
          sub="Across all produce"
          icon={<TrendingUp className="h-4 w-4" />}
          color="yellow"
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["overview", "receipts", "reports"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">

          {/* Delivery Performance + Produce Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Delivery Trend */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Delivery Performance — 6 Weeks
              </h3>
              <p className="text-xs text-gray-400 mb-4">On-time vs delayed vs failed deliveries</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DELIVERY_TREND} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="onTime" name="On Time" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delayed" name="Delayed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Produce Mix Pie */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Produce Mix</h3>
              <p className="text-xs text-gray-400 mb-4">By volume received</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={PRODUCE_MIX}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {PRODUCE_MIX.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {PRODUCE_MIX.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                    {p.name} ({p.value}%)
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supply Loss + Temp Variance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Supply Loss */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Supply Loss Rate</h3>
              <p className="text-xs text-gray-400 mb-4">Percentage loss by produce type</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SUPPLY_LOSS} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="produce" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="loss" name="Loss %" radius={[0, 4, 4, 0]}
                    fill="#ef4444"
                    background={{ fill: "#fef2f2", radius: 4 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Temp Variance */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Temperature Variance — Today
              </h3>
              <p className="text-xs text-gray-400 mb-4">Actual vs target cold-chain temperature</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={TEMP_VARIANCE}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} unit="°C" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="actual" name="Actual °C"
                    stroke="#22c55e" strokeWidth={2} fill="url(#actualGrad)" dot={false} />
                  <Area type="monotone" dataKey="target" name="Target °C"
                    stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPTS TAB ── */}
      {activeTab === "receipts" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Recent Receipts</h3>
              <p className="text-xs text-gray-400 mt-0.5">All incoming produce deliveries</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge-green px-2 py-1">{accepted} Accepted</span>
              <span className="badge-red px-2 py-1">{rejected} Rejected</span>
              <span className="badge-yellow px-2 py-1">{pending} Pending</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Shipment ID", "Produce", "Quantity", "Origin", "Temp at Arrival", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_RECEIPTS.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-800">{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.produce}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.qty}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.from}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={`flex items-center gap-1 ${parseFloat(r.temp) > 8 ? "text-red-600" : "text-gray-700"
                        }`}>
                        <Thermometer className="h-3 w-3" />
                        {r.temp}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${STATUS_STYLES[r.status]} px-2 py-0.5 rounded-full text-xs font-medium`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Export Reports</h3>
                <p className="text-xs text-gray-400">Download compliance reports and receipt logs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "receipt-csv" as const, label: "Receipt Log (CSV)", desc: "All incoming shipments with status", icon: <Download className="h-4 w-4" /> },
                { id: "compliance-pdf" as const, label: "Compliance Report (PDF)", desc: "Cold-chain SLA audit report", icon: <ShieldCheck className="h-4 w-4" /> },
                { id: "quality-pdf" as const, label: "Quality Audit (PDF)", desc: "Temperature variance + breach log", icon: <Thermometer className="h-4 w-4" /> },
                { id: "delivery-csv" as const, label: "Delivery Summary (CSV)", desc: "On-time vs delayed breakdown", icon: <Clock className="h-4 w-4" /> },
              ].map((r) => (
                <button
                  key={r.label}
                  type="button"
                  disabled={exporting !== null}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left group disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void exportRetailReport(r.id)}
                >
                  <div className="p-2 bg-gray-100 group-hover:bg-emerald-100 rounded-lg text-gray-500 group-hover:text-emerald-600 transition-colors">
                    {r.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.desc}</p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 ml-auto transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Actual export bar with real download functionality */}
          <ReportExportBar shipments={shipments} />
        </div>
      )}

    </div>
  );
}
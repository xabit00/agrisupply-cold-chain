"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Shipment } from "@/lib/types";
import { downloadShipmentCsv, downloadShipmentPdf } from "@/lib/utils/report-exports";
import { toast } from "@/stores/toast.store";

export function ReportExportBar({ shipments }: { shipments: Shipment[] }) {
  const [isExporting, setIsExporting] = useState<"pdf" | "csv" | null>(null);

  const exportReport = async (format: "pdf" | "csv") => {
    try {
      setIsExporting(format);
      if (format === "pdf") await downloadShipmentPdf(shipments);
      else await downloadShipmentCsv(shipments);
      toast.success("Report downloaded", `Your ${format.toUpperCase()} report is ready.`);
    } catch (error) {
      console.error(`Failed to generate ${format.toUpperCase()} report`, error);
      toast.error("Report download failed", "Please try again.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => void exportReport("csv")} disabled={isExporting !== null}>
        {isExporting === "csv" ? "Generating CSV..." : "Export CSV"}
      </Button>
      <Button variant="default" size="sm" onClick={() => void exportReport("pdf")} disabled={isExporting !== null}>
        {isExporting === "pdf" ? "Generating PDF..." : "Export PDF Report"}
      </Button>
    </div>
  );
}
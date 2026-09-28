"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export function ReportExportBar({ onExportPdf, onExportCsv }: { onExportPdf: () => void; onExportCsv: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExportCsv}>
        Export CSV
      </Button>
      <Button variant="default" size="sm" onClick={onExportPdf}>
        Export PDF Report
      </Button>
    </div>
  );
}

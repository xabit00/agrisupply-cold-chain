"use client";

import type { Shipment } from "@/lib/types";

export interface ReceiptRow {
  id: string;
  produce: string;
  qty: string;
  from: string;
  temp: string;
  status: string;
  date: string;
}

function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined") throw new Error("Downloads can only be generated in the browser.");
  if (blob.size === 0) throw new Error("The generated report was empty.");

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dateStamp() {
  return new Intl.DateTimeFormat("en-PK", { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date())
    .replace(/\//g, "-");
}

function requireRows(rows: readonly unknown[], reportName: string) {
  if (rows.length === 0) throw new Error(`${reportName} has no data to export.`);
}

function filename(title: string, extension: "pdf" | "csv") {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${dateStamp()}.${extension}`;
}

function shipmentRows(shipments: Shipment[]) {
  return shipments.map((shipment) => [
    shipment.id,
    shipment.trackingNumber,
    shipment.produce.name,
    `${shipment.produce.quantityKg.toLocaleString("en-PK")} kg`,
    shipment.origin.name,
    shipment.destination.name,
    shipment.status,
    shipment.temperatureAlert || shipment.humidityAlert || shipment.tamperAlert ? "Alert" : "Compliant",
  ]);
}

export async function downloadShipmentCsv(shipments: Shipment[], title = "Shipment Report") {
  requireRows(shipments, title);
  const Papa = (await import("papaparse")).default;
  const csv = Papa.unparse(shipments.map((shipment) => ({
    "Shipment ID": shipment.id,
    "Tracking Number": shipment.trackingNumber,
    Produce: shipment.produce.name,
    "Quantity (kg)": shipment.produce.quantityKg,
    Origin: shipment.origin.name,
    Destination: shipment.destination.name,
    Status: shipment.status,
    "Temperature Alert": shipment.temperatureAlert ? "Yes" : "No",
    "Humidity Alert": shipment.humidityAlert ? "Yes" : "No",
    "Tamper Alert": shipment.tamperAlert ? "Yes" : "No",
    "Last Updated": shipment.updatedAt,
  })), { header: true, escapeFormulae: true });

  triggerDownload(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }), filename(title, "csv"));
}

export async function downloadShipmentPdf(shipments: Shipment[], title = "Shipment Report") {
  requireRows(shipments, title);
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(18);
  doc.text(title, 40, 48);
  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleString("en-PK")}`, 40, 66);
  autoTable(doc, {
    startY: 82,
    head: [["ID", "Tracking", "Produce", "Quantity", "Origin", "Destination", "Status", "Compliance"]],
    body: shipmentRows(shipments),
    styles: { fontSize: 7, cellPadding: 4 },
    headStyles: { fillColor: [5, 150, 105] },
    margin: { left: 32, right: 32 },
  });
  triggerDownload(doc.output("blob"), filename(title, "pdf"));
}

export async function downloadReceiptCsv(receipts: ReceiptRow[]) {
  requireRows(receipts, "Receipt log");
  const Papa = (await import("papaparse")).default;
  const csv = Papa.unparse(receipts.map((receipt) => ({
    "Shipment ID": receipt.id,
    Produce: receipt.produce,
    Quantity: receipt.qty,
    Origin: receipt.from,
    "Temperature at Arrival": receipt.temp,
    Status: receipt.status,
    Date: receipt.date,
  })), { header: true, escapeFormulae: true });

  triggerDownload(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }), filename("Receipt Log", "csv"));
}

export async function downloadDeliverySummaryCsv(receipts: ReceiptRow[]) {
  requireRows(receipts, "Delivery summary");
  const Papa = (await import("papaparse")).default;
  const counts = receipts.reduce<Record<string, number>>((summary, receipt) => {
    const key = receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1);
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
  const csv = Papa.unparse(Object.entries(counts).map(([status, count]) => ({ Status: status, Shipments: count })), { header: true });
  triggerDownload(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }), filename("Delivery Summary", "csv"));
}

export async function downloadQualityAuditPdf(shipments: Shipment[], receipts: ReceiptRow[]) {
  requireRows(shipments, "Quality audit");
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(18);
  doc.text("Quality Audit Report", 40, 48);
  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleString("en-PK")}`, 40, 66);
  const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
  autoTable(doc, {
    startY: 82,
    head: [["Shipment", "Produce", "Arrival Temp", "Status", "Temperature", "Humidity", "Tamper"]],
    body: shipments.map((shipment) => {
      const receipt = receiptById.get(shipment.id);
      return [shipment.id, shipment.produce.name, receipt?.temp ?? "Not received", receipt?.status ?? shipment.status, shipment.temperatureAlert ? "Alert" : "OK", shipment.humidityAlert ? "Alert" : "OK", shipment.tamperAlert ? "Alert" : "OK"];
    }),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [185, 28, 28] },
    margin: { left: 32, right: 32 },
  });
  triggerDownload(doc.output("blob"), filename("Quality Audit", "pdf"));
}
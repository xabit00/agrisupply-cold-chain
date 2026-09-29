export function formatCurrency(amount: number, currency: string = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(isoString: string): string {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-PK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTemperature(celsius: number | null | undefined): string {
  if (celsius == null) return 'N/A';
  return `${celsius.toFixed(1)}°C`;
}
export function formatHumidity(pct: number | null | undefined): string {
  if (pct == null) return 'N/A';
  return `${pct.toFixed(1)}%`;
}
/**
 * Single source of truth for the telemetry state shown anywhere in the app.
 *
 * Nothing else may decide telemetry copy: every surface (warehouse status cards,
 * vault sensor rows, telemetry panel, breach banner, transporter chip) maps the
 * same socket status + "do we have readings?" + "is this a local demo feed?"
 * through `telemetryStateView`, so they can never contradict each other and
 * last-known values are never presented as current live telemetry.
 */
export type TelemetryState = "LIVE" | "RECONNECTING" | "OFFLINE_CACHED" | "DEMO";

export interface TelemetryStateView {
  state: TelemetryState;
  /** True only while `sensor:reading` events can actually arrive. */
  isLive: boolean;
  /** True when at least one reading (live or last known) is available. */
  hasReadings: boolean;
  /** Short status label: Live / Connecting / Reconnecting / Offline / Demo. */
  label: string;
  /** Compact note for cards and panel headers. */
  shortNote: string;
  /** Full sentence for the single global status message. */
  detail: string;
  /** Pill/banner shell classes (border / background / text). */
  badgeClass: string;
  /** Bare text colour, for inline status copy. */
  textClass: string;
  /** Badge dot colour; pulses only when readings are actually flowing. */
  dotClass: string;
}

const LIVE_VIEW: TelemetryStateView = {
  state: "LIVE",
  isLive: true,
  hasReadings: true,
  label: "Live",
  shortNote: "Live readings",
  detail: "Live stream active.",
  badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  textClass: "text-emerald-600",
  dotClass: "bg-emerald-500 pulse-dot",
};

const CONNECTING_VIEW: TelemetryStateView = {
  state: "RECONNECTING",
  isLive: false,
  hasReadings: false,
  label: "Connecting",
  shortNote: "Connecting…",
  detail: "Connecting to the live telemetry stream…",
  badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  textClass: "text-amber-600",
  dotClass: "bg-amber-500",
};

const RECONNECTING_VIEW: TelemetryStateView = {
  state: "RECONNECTING",
  isLive: false,
  hasReadings: false,
  label: "Reconnecting",
  shortNote: "Reconnecting…",
  detail: "Reconnecting to the live telemetry stream…",
  badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  textClass: "text-amber-600",
  dotClass: "bg-amber-500",
};

/** Offline but readings exist: they are cached, not current. */
const OFFLINE_CACHED_VIEW: TelemetryStateView = {
  state: "OFFLINE_CACHED",
  isLive: false,
  hasReadings: true,
  label: "Offline",
  shortNote: "Last known readings",
  detail:
    "Socket disconnected — showing last known readings. Current breach status cannot be confirmed.",
  badgeClass: "border-gray-200 bg-gray-100 text-gray-600",
  textClass: "text-gray-500",
  dotClass: "bg-gray-400",
};

/** Offline with nothing to fall back on. */
const OFFLINE_EMPTY_VIEW: TelemetryStateView = {
  state: "OFFLINE_CACHED",
  isLive: false,
  hasReadings: false,
  label: "Offline",
  shortNote: "No telemetry",
  detail: "Live telemetry unavailable — no readings have been received yet.",
  badgeClass: "border-gray-200 bg-gray-100 text-gray-600",
  textClass: "text-gray-500",
  dotClass: "bg-gray-400",
};

/** Values that come from a local demo feed, not from the server stream. */
const DEMO_VIEW: TelemetryStateView = {
  state: "DEMO",
  isLive: false,
  hasReadings: true,
  label: "Demo",
  shortNote: "Simulated readings",
  detail: "Demo telemetry active — values come from the local demo feed, not a live sensor stream.",
  badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  textClass: "text-sky-600",
  dotClass: "bg-sky-500",
};

/**
 * Normalises the raw socket status into the one state every surface renders.
 *
 * Connection state always wins over the demo flag, so a simulated feed can never
 * be shown as "Live" while the socket is down, and a connected socket still
 * reports "Demo" for values it did not deliver.
 */
export function telemetryStateView(input: {
  status?: string | null;
  hasReadings?: boolean;
  isDemo?: boolean;
}): TelemetryStateView {
  const { status, hasReadings = false, isDemo = false } = input;

  if (status === "connected") {
    const connectedView = isDemo ? DEMO_VIEW : LIVE_VIEW;
    return { ...connectedView, hasReadings };
  }
  if (status === "connecting") return CONNECTING_VIEW;
  if (status === "reconnecting") return RECONNECTING_VIEW;

  // Unknown/absent statuses fall back to the offline views — never to "Live".
  return hasReadings ? OFFLINE_CACHED_VIEW : OFFLINE_EMPTY_VIEW;
}

/**
 * Label for a value/severity badge (e.g. a vault sensor row) that carries the
 * telemetry state, so a stale severity is never shown as if it were current.
 */
export function telemetryValueLabel(
  severityLabel: string,
  view: TelemetryStateView,
  isDemo = false
): string {
  if (view.state === "RECONNECTING") return "Reconnecting…";
  if (view.state === "OFFLINE_CACHED") return `Last known: ${severityLabel}`;
  return isDemo ? `Demo · ${severityLabel}` : severityLabel;
}

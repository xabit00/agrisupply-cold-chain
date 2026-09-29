/**
 * Cold-chain telemetry simulator — the single source of truth for how a
 * SensorReading is produced and how a breach is evaluated.
 *
 * Deliberately plain JS + JSDoc: it is imported by `server.js` (CommonJS, which
 * cannot load TypeScript) AND by the Next.js `/api/iot` route (webpack, with
 * `allowJs: true`). Both callers therefore simulate the exact same physics, so
 * the REST bootstrap history and the socket stream can never disagree.
 *
 * The walk is a sine wave centred on the shipment's own SLA envelope with a
 * slight overreach, so temperature/humidity periodically drift outside the
 * window and breach events actually occur during a demo.
 *
 * @typedef {Object} Envelope
 * @property {number} tempMin
 * @property {number} tempMax
 * @property {number} humidityMin
 * @property {number} humidityMax
 *
 * @typedef {Object} SimulatedShipment
 * @property {string} id
 * @property {Envelope} produce
 * @property {{lat: number, lng: number}} originCoords
 *
 * @typedef {Object} SimState
 * @property {number} phase
 * @property {number} batteryPct
 * @property {{lat: number, lng: number}} location
 * @property {number} noiseSeed
 */

/** Deterministic 32-bit PRNG (mulberry32) so bootstrap history is stable. */
function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable numeric seed from a shipment id, so history is reproducible. */
function seedFromId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Creates the mutable simulation state for a shipment.
 *
 * @param {SimulatedShipment} shipment
 * @returns {SimState}
 */
function createSimState(shipment) {
  const { tempMin, tempMax, humidityMin, humidityMax } = shipment.produce;
  const rng = createRandom(seedFromId(shipment.id));

  return {
    phase: rng() * Math.PI * 2,
    batteryPct: Math.round(78 + rng() * 20),
    location: { ...shipment.originCoords },
    noiseSeed: rng() * 1000,
  };
}

/** Bounded value helper. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Rounds to 1 decimal — keeps payload size and chart ticks tidy. */
function round1(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Advances one tick. The wave intentionally overreaches the envelope by ~15%,
 * so each shipment periodically records a genuine TEMP_HIGH/HUMIDITY_HIGH.
 *
 * @param {SimulatedShipment} shipment
 * @param {SimState} state
 * @param {number} tick
 * @param {number} intervalMs
 */
function advance(shipment, state, tick, intervalMs) {
  const { tempMin, tempMax, humidityMin, humidityMax } = shipment.produce;
  const tempCentre = (tempMin + tempMax) / 2;
  const tempHalf = (tempMax - tempMin) / 2;
  const humCentre = (humidityMin + humidityMax) / 2;
  const humHalf = (humidityMax - humidityMin) / 2;

  // ~60s per full cycle at a 1.5s interval.
  state.phase += (Math.PI * 2 * intervalMs) / 60000;
  const rng = createRandom(Math.floor(state.noiseSeed) + tick);
  const noise = (rng() - 0.5) * 0.4;

  const temperature = round1(
    tempCentre + tempHalf * 1.15 * Math.sin(state.phase) + noise
  );
  const humidity = Math.round(
    clamp(
      humCentre + humHalf * 1.15 * Math.cos(state.phase * 1.3) + noise * 4,
      0,
      100
    )
  );

  state.batteryPct = round1(clamp(state.batteryPct - 0.02, 5, 100));

  // Both modules creep ~15% of the way toward the destination per minute.
  state.location = {
    lat: round1(state.location.lat + (rng() - 0.5) * 0.06),
    lng: round1(state.location.lng + (rng() - 0.5) * 0.06),
  };

  return {
    temperature,
    humidity,
    batteryPct: state.batteryPct,
    signalStrengthDbm: Math.round(-58 - rng() * 26),
    location: { lat: state.location.lat, lng: state.location.lng },
  };
}

/**
 * Evaluates a sample against the shipment's SLA envelope.
 *
 * @param {{temperature: number, humidity: number}} sample
 * @param {Envelope} envelope
 * @returns {{isBreached: boolean, breachReason?: string}}
 */
function evaluate(sample, envelope) {
  if (sample.temperature > envelope.tempMax) {
    return { isBreached: true, breachReason: "TEMP_HIGH" };
  }
  if (sample.temperature < envelope.tempMin) {
    return { isBreached: true, breachReason: "TEMP_LOW" };
  }
  if (sample.humidity > envelope.humidityMax) {
    return { isBreached: true, breachReason: "HUMIDITY_HIGH" };
  }
  if (sample.humidity < envelope.humidityMin) {
    return { isBreached: true, breachReason: "HUMIDITY_LOW" };
  }
  return { isBreached: false };
}

/**
 * Builds a plausible, deterministic history for the chart bootstrap so the
 * panel has data before the first socket event arrives.
 *
 * @param {SimulatedShipment} shipment
 * @param {number} points
 * @param {number} intervalMs
 * @returns {object[]} newest last
 */
function createHistory(shipment, points, intervalMs) {
  const state = createSimState(shipment);
  const readings = [];

  for (let i = 0; i < points; i += 1) {
    const sample = advance(shipment, state, i, intervalMs);
    const verdict = evaluate(sample, shipment.produce);
    readings.push({
      id: `rd_hist_${shipment.id}_${i}`,
      shipmentId: shipment.id,
      timestamp: new Date(Date.now() - (points - i) * intervalMs).toISOString(),
      ...sample,
      ...verdict,
    });
  }

  return readings;
}

/**
 * Maps a Shipment from the register (API shape) into the simulator's input,
 * so `server.js` and `/api/iot` convert records identically.
 *
 * @param {object} shipment
 * @returns {SimulatedShipment}
 */
function fromApiShipment(shipment) {
  return {
    id: shipment.id,
    produce: {
      tempMin: shipment.produce.optimalTempMin,
      tempMax: shipment.produce.optimalTempMax,
      humidityMin: shipment.produce.optimalHumidityMin,
      humidityMax: shipment.produce.optimalHumidityMax,
    },
    originCoords: {
      lat: shipment.origin.coordinates.lat,
      lng: shipment.origin.coordinates.lng,
    },
  };
}

module.exports = {
  createRandom,
  createSimState,
  advance,
  evaluate,
  createHistory,
  seedFromId,
  fromApiShipment,
};

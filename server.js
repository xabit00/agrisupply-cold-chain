/* eslint-disable */
/**
 * AgriSupply custom server: Next.js + Socket.io on one port, one command.
 *
 *   npm run dev    → node server.js --dev   (hot reload, sockets live)
 *   npm run start  → node server.js         (production build, sockets live)
 *
 * Emits `sensor:reading` for every active shipment every TICK_MS, plus a
 * `sensor:alert` when a reading breaches that shipment's own SLA envelope.
 * Simulation logic lives in lib/server/telemetry-emitter.js and is shared with
 * GET /api/iot, so the REST bootstrap and the socket stream cannot diverge.
 *
 * The register itself is read from this app's own /api/shipments endpoint, so
 * server.js never reaches around Next for shipment data.
 */
const { createServer } = require("http");
const { randomBytes } = require("crypto");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const {
  createSimState,
  advance,
  evaluate,
  fromApiShipment,
} = require("./lib/server/telemetry-emitter");

const dev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
process.env.INTERNAL_API_KEY ||= randomBytes(32).toString("hex");
process.env.JWT_SECRET ||= randomBytes(48).toString("hex");
const port = Number(process.env.PORT) || 3000;
const TICK_MS = 1500;
const SNAPSHOT_TTL_MS = 10000;
const ACTIVE_STAGES = new Set(["Harvested", "InTransit", "ColdStorage"]);

const app = next({ dev });
const handle = app.getRequestHandler();

let io = null;
let httpServer = null;
let snapshot = { shipments: [], fetchedAt: 0 };
const simStates = new Map();
let tickCount = 0;
let intervalId = null;

/** Reads the active shipments from our own API — single source of truth. */
async function refreshSnapshot() {
  if (Date.now() - snapshot.fetchedAt < SNAPSHOT_TTL_MS) return;

  try {
    const response = await fetch(
      `http://127.0.0.1:${port}/api/shipments?pageSize=100&statusFilter=ALL`,
      { cache: "no-store", headers: { "x-agri-internal": process.env.INTERNAL_API_KEY } }
    );
    const body = await response.json();

    if (body.success && Array.isArray(body.data.items)) {
      snapshot = {
        shipments: body.data.items.filter((item) => ACTIVE_STAGES.has(item.status)),
        fetchedAt: Date.now(),
      };
    }
  } catch (error) {
    // App not ready yet / transient failure — keep the previous snapshot.
    snapshot.fetchedAt = Date.now();
  }
}

async function tick() {
  if (!io || io.engine.clientsCount === 0) return;

  await refreshSnapshot();
  tickCount += 1;

  for (const raw of snapshot.shipments) {
    const simShipment = fromApiShipment(raw);

    if (!simStates.has(simShipment.id)) {
      simStates.set(simShipment.id, createSimState(simShipment));
    }

    const state = simStates.get(simShipment.id);
    const now = Date.now();
    const sample = advance(simShipment, state, tickCount, TICK_MS);
    const verdict = evaluate(sample, simShipment.produce);

    const reading = {
      id: `rd_${now}_${simShipment.id}`,
      shipmentId: simShipment.id,
      timestamp: new Date(now).toISOString(),
      ...sample,
      ...verdict,
    };

    io.emit("sensor:reading", reading);

    if (verdict.isBreached) {
      io.emit("sensor:alert", reading);
    }
  }
}

function shutdown(signal) {
  if (intervalId) clearInterval(intervalId);
  if (io) io.close();
  if (httpServer) httpServer.close(() => process.exit(0));

  setTimeout(() => process.exit(0), 3000).unref();
  // eslint-disable-next-line no-console
  console.log(`\n[mock-sensor] shutting down (${signal})`);
}

app.prepare().then(() => {
  httpServer = createServer((req, res) => handle(req, res));

  io = new Server(httpServer, {
    path: "/socket.io",
    // Same origin (:3000) by construction, but allow reverse proxies/https.
    cors: { origin: true, credentials: true },
    serveClient: false,
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const token = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith("agri_auth_token="))?.slice("agri_auth_token=".length);
      if (!token) return next(new Error("Authentication required"));
      socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error("Invalid or expired session"));
    }
  });

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[mock-sensor] client connected ${socket.id}`);
    socket.emit("sensor:hello", { ok: true, intervalMs: TICK_MS });

    socket.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log(`[mock-sensor] client disconnected ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `> AgriSupply ready on http://localhost:${port} (${dev ? "dev" : "production"} + socket.io)`
    );
  });

  intervalId = setInterval(tick, TICK_MS);

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
});

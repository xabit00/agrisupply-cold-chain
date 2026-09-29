# TESTING — Manual Test Script

**Status:** M0–M4 complete (auth/RBAC, services+state, data tables, forms engine).
Latest commit: `10bb115`. `tsc --noEmit` = 0 errors, `next lint` = clean, `next build` = success.

---

## 1. Start the app

```powershell
cd "e:\spark task"
npm run dev
```

Open **http://localhost:3000** — it redirects to `/login`.

> Data lives in an **in-memory mock store**. Restarting the dev server resets everything
> back to the 8 seeded batches (`SHP-001` … `SHP-008`). This is expected, not a bug.

---

## 2. Sign in

Click a **Demo Persona Fast-Select** tile — it fills the email/password for you. Or type manually.

| Persona | Email | Password | Lands on |
|---|---|---|---|
| Farmer (Elena Rostova) | `farmer@agrisupply.com` | `Pass123!` | `/farmer` |
| Transporter (Marcus Vance) | `transporter@agrisupply.com` | `Pass123!` | `/transporter` |
| Warehouse (Sarah Chen) | `warehouse@agrisupply.com` | `Pass123!` | `/warehouse` |
| Retailer (David Kim) | `retailer@agrisupply.com` | `Pass123!` | `/retailer` |

**Pass / fail:** wrong password → inline red error, no redirect. Correct → redirected to that
role's route, avatar + name visible in the sidebar.

---

## 3. M4 test — the registration wizard (main event)

**Route:** `/farmer` → click **Register Batch** (top-right, green).

### 3.1 The happy path
1. **Step 1 · Produce** — type a batch name (e.g. `Test Avocados`), pick **Fruits**, set weight `500` kg.
   - *Expect:* picking a category **autofills** temp/humidity/storage mode below and shows an SLA chip strip.
2. Click **Next** → **Step 2 · Cold-Chain**.
   - *Expect:* Refrigerated mode shows 4 envelope inputs pre-filled from the preset.
3. Click **Next** → **Step 3 · Routing** — choose Destination type **Warehouse**, pick a warehouse,
   pick a transporter, tick **Tamper-evident seal** and enter e.g. `SEAL-9911`.
4. **Review** step — check the summary rows.
5. Click **Register batch**.
   - *Expect:* dialog closes → **green toast** "Batch … registered" → new row is **first in the table** →
     `Registered Batches` tile increments (8 → 9).
6. Click that row → detail card shows **Cold-Chain Evidence** photos, container split, seal, notes.

### 3.2 Conditional fields — the actual feature
| Do this | Expect |
|---|---|
| Storage mode → **Ambient** | 4 temp/humidity inputs **disappear** + explanation box appears |
| Storage mode back to **Refrigerated** | inputs **reappear**, refilled from preset |
| Category → **Meat** or **Seafood** | "photo evidence required" warning appears; submit blocked without ≥1 photo |
| Destination type → **Retailer** | retailer select appears; switching to **Warehouse** clears it |
| Toggle **Split batch across containers** | container list appears + live counter `Allocated 500 / 500 kg · unallocated 0 kg` |
| Set one container weight to 400 | counter turns **amber**; submit blocked with weight-mismatch message |
| Tick **Tamper-evident seal** | seal input appears; submit blocked if seal ID < 4 chars |

### 3.3 Photo capture
- Click **Capture** → browser asks for camera → live preview → **Take photo**.
- If camera is blocked: use **Upload** (always works), or the permission hint in the UI.
- Add 3 photos, then try a 4th → blocked at max 3.
- Thumbnails are ~640 px / small JPEG (check DevTools → Network → POST payload size).

### 3.4 Offline enqueue
1. DevTools → Network → **Offline**.
2. Submit the form.
   - *Expect:* amber/info toast "queued for sync", no crash, form resets.
3. Back **Online** → the queued create flushes and the row appears.

### 3.5 Server-side validation (shared Zod schema)
These must fail identically whether submitted from the form or by hitting the API directly:

```powershell
# From a *new terminal* (server must already be running):
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/shipments `
  -ContentType 'application/json' -Body '{"farmerId":"x"}' | ConvertTo-Json -Depth 5
```
*Expect:* `400` with a list of `issues`, each carrying a field `path` and message.
Try these in the UI too:

| Action | Expected message |
|---|---|
| Min temp > max temp | "Maximum temperature must be greater than the minimum" |
| Seafood with 0 photos | "Seafood lots require at least one cold-chain evidence photo" |
| 4 photos | "A maximum of 3 photos can be attached" |
| Destination=Retailer, no outlet | "Select the receiving retail outlet" |
| Container weights ≠ total | "Container weights must total 500 kg …" |
| No transporter selected | "Select the assigned transporter" |

> The **same** `shipmentSchema` runs in the browser (react-hook-form) and in
> `POST /api/shipments`. If a message appears in both places, that's the feature working.

---

## 4. M3 test — register table

On `/farmer`, below the 4 metric tiles:

| Check | Do | Expect |
|---|---|---|
| Seeded data | load page | 8 rows (`TRK-9821` … `TRK-9828`), `Total: 8` |
| Search | type `salmon` | row count shrinks, total updates |
| Filter | Status = `Delivered` | only delivered rows |
| Filter | Category = `Flowers` | only the tulip batch |
| Sort | click a column header | arrow flips asc/desc, order changes |
| Pagination | page size 5 | 2 pages, arrows work |
| Reset | ⟳ button | filters cleared, all rows back |
| Empty state | search `zzzzz` | friendly empty illustration + "Reset filters" |
| Detail | click any row | side card with SLA envelope, route, photos |

The **Sync Cold-Chain** button in the header force-refetches (spinner while running).

---

## 5. Cross-role check

Sign out via the **Sign out** button in the top-right header, then sign in as **Transporter** /
**Warehouse** / **Retailer**.
*Expect:* each lands on its own route. **Farmer** functionality (register + table) is the only
fully wired flow so far — the other three show their page shell + placeholder cards. **This is
expected** (they belong to later milestones), not a defect.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Camera button does nothing | Browsers block cameras on non-localhost origins. Use **Upload**, or serve over `https://localhost`. |
| Blank page after a pull | Hard refresh `Ctrl+Shift+R`; if stale, delete `.next` and restart `npm run dev`. |
| Rows vanished after restart | In-memory store — data resets on server restart. Working as designed. |
| `EADDRINUSE` on 3000 | Another dev server is running — close it or use `npm run dev -- -p 3001`. |
| Port 3000 occupied by old build | `npm run build && npm run start` serves the production build instead. |

---

## 7. Quality gates (run before any commit)

```powershell
npx tsc --noEmit     # 0 errors
npm run lint         # 0 warnings
npm run build        # completes
```

---

## 8. Not built yet — don't report these as bugs

- **M5** Kanban pipeline board + analytics charts
- **M6** live IoT sensor stream / websockets
- **M7** map & geofence tracking
- **M8** offline queue manager UI (enqueue works now; the *list* screen doesn't exist)
- **M9** PDF/CSV exports
- **M10** responsive/overflow audit

---

## 9. Sign-off checklist

- [ ] App boots, login works for all 4 personas
- [ ] Farmer hub shows 4 tiles + 8 seeded rows
- [ ] Register Batch: 3 steps complete, conditional fields toggle, photos attach
- [ ] New batch appears at row 1 and increments the tile
- [ ] Detail card shows photos / containers / seal
- [ ] Search, filter, sort, pagination, empty state all behave
- [ ] At least one deliberately invalid submission shows the right message
- [ ] `tsc` / `lint` / `build` all green


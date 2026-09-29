# TESTING — Manual Test Script

**Status:** M0–M5 complete (auth/RBAC, services+state, data tables, forms engine, Kanban pipeline + analytics charts).
Quality gates at the time of writing: `tsc --noEmit` = 0 errors, `next lint` = clean, `next build` = success.

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
| Farmer (Muhammad Yousaf) | `farmer@agrisupply.pk` | `Pass123!` | `/farmer` |
| Transporter (Asif Javed) | `transporter@agrisupply.pk` | `Pass123!` | `/transporter` |
| Warehouse (Sara Ahmed) | `warehouse@agrisupply.pk` | `Pass123!` | `/warehouse` |
| Retailer (Nadia Hussain) | `retailer@agrisupply.pk` | `Pass123!` | `/retailer` |

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

## 5. M5 test — Kanban pipeline board

On `/farmer`, in the register toolbar, click **Board** (toggle next to the filters).

| Check | Do | Expect |
|---|---|---|
| Columns | switch to Board | 6 columns: Draft → Harvested → InTransit → ColdStorage → Delivered → Compromised, each with a count + kg total |
| Cards | look at columns | 8 seeded batches, showing produce, tracking #, kg, temp envelope, destination, photo/container counts |
| **Drag** | drag any card into a different column | card moves, header shows `Saving…`, then **green toast** "<tracking #> moved to <stage>" |
| Register sync | click **Register** toggle | the row now shows the new status |
| Charts sync | scroll to **Cold-Chain Analytics** | "Batches by stage" bars re-balance immediately |
| Reject drop | drop a card back where it started | **no** request fires, no toast (no-op) |
| Empty column | drag the last card out of `Compromised` | friendly "No batches / drag here" placeholder |
| Inspect | click **Inspect** on a card | detail card opens (same as clicking a table row) |
| Filters | type in search / pick a category while in Board view | board narrows; status filter is hidden (columns already segment by status) |
| Reset | ⟳ with filters active | board shows all 8 again |
| Delivery analytics | drag a batch into **Delivered** | `deliveredAt` is stamped server-side, "Avg delivery cycle" chart gains that category, `avgDeliveryHours` metric updates |

**Server-side guard (API check):**

```powershell
# Unknown stage must be rejected with 400 + issues[]
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/shipments/SHP-001 `
  -ContentType 'application/json' -Body '{"status":"BogusStage"}'   # → 400

# Extra/unknown fields must be rejected too (.strict())
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/shipments/SHP-001 `
  -ContentType 'application/json' -Body '{"status":"InTransit","farmerId":"hacked"}'  # → 400
```

---

## 6. M5 test — analytics charts

Below the register on `/farmer`, section **Cold-Chain Analytics**:

| Check | Expect |
|---|---|
| 3 KPI pills | Loss rate `12.5%`, SLA compliance `87.5%`, Avg delivery cycle `30.5h` (seed) |
| Batches by stage | 6 bars, one per status, colored to match the status badges |
| Avg delivery cycle | one bar per category **that has a completed delivery** (Dairy/Meat only at seed) |
| Cold-chain integrity | stacked bars: green "within envelope" + red "active alert" (Flowers has the seeded alert) |
| Tooltips | hover any bar for exact numbers |
| No data | register empty → "No analytics yet" placeholder instead of blank charts |

---

## 7. Cross-role check

Sign out via the **Sign out** button in the top-right header, then sign in as **Transporter** /
**Warehouse** / **Retailer**.
*Expect:* each lands on its own route. **Farmer** functionality (register + table) is the only
fully wired flow so far — the other three show their page shell + placeholder cards. **This is
expected** (they belong to later milestones), not a defect.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Camera button does nothing | Browsers block cameras on non-localhost origins. Use **Upload**, or serve over `https://localhost`. |
| Blank page after a pull | Hard refresh `Ctrl+Shift+R`; if stale, delete `.next` and restart `npm run dev`. |
| Rows vanished after restart | In-memory store — data resets on server restart. Working as designed. |
| `EADDRINUSE` on 3000 | Another dev server is running — close it or use `npm run dev -- -p 3001`. |
| Port 3000 occupied by old build | `npm run build && npm run start` serves the production build instead. |

---

## 9. Quality gates (run before any commit)

```powershell
npx tsc --noEmit     # 0 errors
npm run lint         # 0 warnings
npm run build        # completes
```

---

## 10. Not built yet — don't report these as bugs

- **M6** live IoT sensor stream / websockets
- **M7** map & geofence tracking
- **M8** offline queue manager UI (enqueue works now; the *list* screen doesn't exist)
- **M9** PDF/CSV exports
- **M10** responsive/overflow audit

---

## 11. Sign-off checklist

- [ ] App boots, login works for all 4 personas
- [ ] Farmer hub shows 4 tiles + 8 seeded rows
- [ ] Register Batch: 3 steps complete, conditional fields toggle, photos attach
- [ ] New batch appears at row 1 and increments the tile
- [ ] Detail card shows photos / containers / seal
- [ ] Search, filter, sort, pagination, empty state all behave
- [ ] At least one deliberately invalid submission shows the right message
- [ ] **Board** view shows 6 columns and a card drags across with a success toast
- [ ] **Cold-Chain Analytics** renders 3 KPIs + 3 charts from real data
- [ ] `tsc` / `lint` / `build` all green


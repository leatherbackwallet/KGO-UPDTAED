# Plan: Fix High Google Cloud Cost (January 2026 Billing)

## What the January Bill Shows

- **Total**: €48.25 (after credits)
- **App Engine**: €43.42
  - **Frontend Instances: €36.00** (largest line item)
  - Flex Instance Core Hours: €5.55
  - Flex Instance RAM: €1.87
- **Artifact Registry**: €4.82

---

## GCloud Verification (What Is Actually Deployed)

Checked via `gcloud app versions describe`:

| Service                | Version            | env          | runtime  | instanceClass | automaticScaling                  |
|------------------------|--------------------|--------------|----------|---------------|-----------------------------------|
| **default** (frontend) | 20260106131541     | **standard** | nodejs20 | F1            | standardSchedulerSettings (max 3) |
| **api** (backend)      | api-20260106131541 | **standard** | nodejs20 | F2            | standardSchedulerSettings (max 3) |

**Conclusion:** Both services are already **Standard**, not Flexible.

**Billing product names (from GCP docs):**

- **"Frontend Instances"** = App Engine **Standard** F-class instance hours (F1, F2, F4). The €36 is Standard instance hours, not Flexible.
- **"Flex Instance Core Hours" / "Flex Instance RAM"** = Flexible environment only. The €5.55 + €1.87 are from **old Flexible version(s)** that ran in early January (before the 6 Jan Standard deployment).

---

## Root Cause: High Standard Instance Hours + Keep-Alive

1. **€36 "Frontend Instances"**  
   Both services use F-class (default = F1, api = F2). The €36 is the **combined** Standard instance hours. If instances stay warm most of the time, hours add up (~720 h × rate ≈ €36).

2. **Keep-alive workflow prevents scale-to-zero**  
   [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml) runs on a schedule:
   - **Business hours (1–17 UTC):** every **3 minutes** → pings API (health, warmup, products).
   - **Night:** every **20 minutes**.
   - Also pings frontend once per run (`https://keralagiftsonline.in`).

   The **API** is hit every 3 minutes for most of the day, which keeps at least one instance warm and prevents scale-to-zero. The **default** service gets one request per run and can stay warm too. Result: high F-class instance hours and the €36 "Frontend Instances" line.

3. **€5.55 + €1.87 Flex**  
   From Flexible environment usage: an **old Flexible version** that was still serving in the first days of January. No current version is Flex (confirmed via gcloud).

4. **€4.82 Artifact Registry**  
   Stored container images from earlier Flexible builds. Independent of Standard vs Flex for the live app.

---

## Plan: Reduce Cost (All Options Considered)

### Option A (recommended): Relax or disable keep-alive so instances can scale to zero

- **Change** [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml):
  - **A1 (minimal cost):** Disable the schedule (comment out or remove the `schedule:` block). Keep `workflow_dispatch` for manual pings. Both services can scale to zero; first request after idle may cold-start.
  - **A2 (balance):** Run much less often (e.g. once per hour or a few times per day). Lower instance hours, some cold starts.
- **Trade-off:** Fewer pings reduces "Frontend Instances" (F-class) cost; more cold starts after idle.

### Option B: Clean up Artifact Registry (€4.82)

- List and delete old container images (e.g. `gcloud artifacts docker images list`, then delete unused repos/versions). Keep only what is needed for current Standard deployments (if any).
- Document the steps or add a small script so you can repeat periodically.

### Option C (optional): Frontend deploy from `frontend/` with Standard-only app.yaml

- **Purpose:** Hygiene: Standard-only config, smaller upload. Both services are already Standard; this is consistency and clarity.
- **Create** [frontend/app.yaml](frontend/app.yaml): Standard-only (`runtime: nodejs20`, `service: default`, `instance_class: F1` or F2, `automatic_scaling` with `min_instances: 0`, same `env_variables` as now, handlers; **no** `resources`, **no** `entrypoint`).
- **Ensure** [frontend/package.json](frontend/package.json) `start` runs the app (e.g. `node server.js`) so `/health` works.
- **Update** [deploy.sh](deploy.sh): deploy default service from `frontend/` using `frontend/app.yaml` (e.g. `cd frontend && gcloud app deploy app.yaml ...`).
- **Add** [frontend/.gcloudignore](frontend/.gcloudignore) to avoid uploading backend and unneeded files; ensure build runs so `.next` exists for `npm start`.

### Option D: Document billing and verify in Console

- Add a short doc (e.g. in repo or COST_*.md) that:
  - **"Frontend Instances"** = Standard F-class instance hours (default + api).
  - **Flex** line items = only from Flexible; current live versions are Standard; remaining Flex is from old versions (e.g. early January).
- Recommend checking **Billing → Reports** filtered by **App Engine** and by **SKU** (e.g. "Frontend Instances", "Flex Instance") to confirm which service/version drives each cost.

### What not to do

- Do not assume "Frontend Instances" means Flexible; gcloud shows both services as Standard. The main lever for €36 is **reducing F-class instance hours** (Option A).
- Flex charges will naturally drop as no new Flexible versions are deployed; optional cleanup of old Flex versions in the console can be done once if any are still present.

---

## Summary of Recommended Changes

| Priority | Item | Action |
|----------|------|--------|
| 1 | [.github/workflows/keep-alive.yml](.github/workflows/keep-alive.yml) | Disable or greatly reduce schedule (Option A) so both services can scale to zero. |
| 2 | Artifact Registry | Document/script to delete old Flexible images (Option B). |
| 3 | [frontend/app.yaml](frontend/app.yaml) + [deploy.sh](deploy.sh) | Optional: deploy default from `frontend/` with Standard-only app.yaml (Option C). |
| 4 | Docs | Document billing (Option D). |

---

## Expected Cost After Fix

- **With Option A (keep-alive disabled or rare):** F-class instance hours drop; both services can scale to zero. App Engine total can move into **€0–10/month** range (free tier + light usage). Flex line items should not recur; Artifact Registry €4.82 can be reduced over time (Option B).
- **Total:** Roughly **€5–12/month** instead of **€48**, with cold starts after idle as the trade-off.

---

## Verification After Changes

- Run `gcloud app versions list --service=default` and `gcloud app versions describe <version> --service=default --format="yaml"` to confirm `env: standard`.
- After 24–48 hours, check **Billing → Reports** (filter by App Engine). Instance hours and "Frontend Instances" cost should drop.

---

## Implementation status

- **Option A:** Keep-alive schedule disabled in `.github/workflows/keep-alive.yml` (manual run only via `workflow_dispatch`).
- **Option B:** Steps documented in `docs/ARTIFACT_REGISTRY_CLEANUP.md`.
- **Option C:** `frontend/app.yaml` (Standard only), `frontend/.gcloudignore`, `frontend/package.json` (`start`: `node server.js`, `gcp-build`), `deploy.sh` deploys frontend from `frontend/` with `app.yaml`.
- **Option D:** Billing explained in `docs/BILLING_EXPLANATION.md`.

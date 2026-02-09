# Google Cloud Billing Explanation

## App Engine product names

- **"Frontend Instances"** = Standard environment **F-class** instance hours (F1, F2, F4). This is the main App Engine compute line item when using Standard. It is **not** Flexible; both default and api services use F-class when running Standard.
- **"Backend Instances"** = Standard environment B-class instance hours (if you ever use B1, B2, etc.).
- **"Flex Instance Core Hours"** / **"Flex Instance RAM"** = **Flexible** environment only. If you see these, they are from a Flexible version (e.g. old deployments before switching to Standard).

## How to verify in Console

1. Go to **Billing → Reports**.
2. Filter by **Service**: App Engine.
3. Group or filter by **SKU** to see:
   - Frontend Instances (F-class hours)
   - Flex Instance Core Hours / Flex Instance RAM (Flex only)

## Cost levers

- **Scale to zero:** With `min_instances: 0`, F-class instance hours drop when there is no traffic. Anything that pings the app frequently (e.g. keep-alive cron) prevents scale-to-zero and keeps "Frontend Instances" cost high.
- **Artifact Registry:** Stored container images are billed separately; clean up old images to reduce that line item.

See **PLAN_FIX_HIGH_GCP_COST.md** for the full cost fix plan.

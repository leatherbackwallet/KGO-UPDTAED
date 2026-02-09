# Artifact Registry Cleanup (Reduce ~€4.82/month)

Old App Engine Flexible deployments pushed container images to Artifact Registry. Those images are still stored and billed. Cleaning them up reduces cost.

## Steps

1. **List repositories**
   ```bash
   gcloud artifacts repositories list --project=onyourbehlf --location=us-central1
   ```

2. **List Docker images** (if using Docker repository)
   ```bash
   gcloud artifacts docker images list us-central1-docker.pkg.dev/onyourbehlf/gae-flexible --include-tags
   ```

3. **Delete old/unused images**
   - In Google Cloud Console: **Artifact Registry** → select repository (e.g. `gae-flexible`) → delete old image versions.
   - Or use `gcloud artifacts docker images delete IMAGE_URL` for specific tags.

4. **Keep only what you need**
   - Current App Engine Standard deployments do not use these container images; you can delete all Flexible-era images if no rollback is needed.
   - If in doubt, keep the most recent 1–2 versions and delete the rest.

## Optional: Retention policy

In Artifact Registry, you can set a **cleanup policy** (e.g. keep last N versions) so old images are removed automatically. See: Artifact Registry → Repository → **Cleanup policies**.

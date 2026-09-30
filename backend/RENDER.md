# Render deploy settings

## Dashboard settings (Root Directory = `backend`)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm ci --include=dev --include=optional && npm run build` |
| Start Command | `npm start` |

**Do not use `yarn`.** The `$` prefix in Render UI is a path hint only — do not type it.

---

## Environment variable (important for Free tier)

Add this in Render → **Environment**:

| Key | Value |
|-----|-------|
| `NODE_OPTIONS` | `--max-old-space-size=384` |

This prevents **JavaScript heap out of memory** during `tsc` build on 512 MB instances.

---

## If build still runs out of memory

**Option A — Upgrade instance (recommended for production)**

Render → Settings → Instance Type → **Starter** ($7/mo, 512 MB dedicated)

**Option B — Single combined command**

Set **Build Command** to empty or `echo skip` and **Start Command** to:

```
npm run render:start
```

This installs, builds, and starts in one step (slower cold start).

---

## Required env vars

- `MONGODB_URI`
- `JWT_SECRET` (32+ characters)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FRONTEND_URL` (Vercel URL, no trailing slash)
- `PORT` = `10000`

---

## Verify

`https://elite-estate-crm.onrender.com/health` -> `{"status":"ok",...}`

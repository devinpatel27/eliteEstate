# Elite Estate Deployment

This repository contains the Elite Estate CRM application:

- `frontend/`: Next.js CRM interface
- `backend/`: Express API and optional synthetic sample seed

## Data isolation policy

Use a dedicated Elite Estate database. Never reuse a database belonging to
another customer or the EstateFlow demonstration deployment. The optional
sample seed contains only synthetic records and can be run repeatedly without
creating duplicates.

```bash
cd backend
npm ci
npm run seed:sample
```

Administrator login is configured through the backend environment:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Backend environment

```env
DATABASE_URL=<dedicated Elite Estate database URL>
MONGODB_URI=<same value when using MongoDB>
JWT_SECRET=<strong random secret>
ADMIN_NAME=Elite Estate Admin
ADMIN_EMAIL=admin@eliteestate.com
ADMIN_PASSWORD=<strong unique password>
FRONTEND_URL=<deployed frontend URL>
WEBSITE_URL=<deployed website URL>
```

## Frontend environment

```env
NEXT_PUBLIC_API_URL=<deployed backend URL>/api
NEXT_PUBLIC_UPLOADS_URL=<deployed backend URL>
```

Build both applications before deployment:

```bash
cd backend && npm ci && npm run build
cd ../frontend && npm ci && npm run build
```

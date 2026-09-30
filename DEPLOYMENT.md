# Elite Estate Demo Deployment

This repository contains the Elite Estate CRM demo application:

- `frontend/`: Next.js CRM interface
- `backend/`: Express API and synthetic demo seed

## Demo data policy

Do not connect this deployment to any production database. Use a new, empty
database dedicated to Elite Estate. The demo seed contains only synthetic
records and can be run repeatedly without creating duplicates.

```bash
cd backend
npm ci
npm run seed:demo
```

Demo login:

- Email: `demo@eliteestate.com`
- Password: `Demo@12345`

## Backend environment

```env
DATABASE_URL=<dedicated Elite Estate database URL>
MONGODB_URI=<same value when using MongoDB>
JWT_SECRET=<strong random secret>
ADMIN_NAME=Elite Estate Demo Admin
ADMIN_EMAIL=demo@eliteestate.com
ADMIN_PASSWORD=Demo@12345
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

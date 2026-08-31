# BalajiInfoTech Admin Dashboard

## Start backend
From `backend/`:
```bash
npm install
npm run dev
```

Add `JWT_SECRET` to `.env`.

Create the first admin once with:
`POST http://localhost:5000/api/auth/setup`

Then use the dashboard.

## Start dashboard
From `admin-dashboard/`:
```bash
npm install
npm run dev
```

The dashboard defaults to `http://localhost:5173` and talks to `http://localhost:5000/api`.

## Current features
- Secure JWT admin login
- Dashboard stats
- Projects add/edit/delete
- Packages add/edit/delete
- Prices and offer prices
- Client enquiry list/status
- Responsive mobile admin layout

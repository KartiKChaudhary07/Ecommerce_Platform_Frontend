# BookNest E-Commerce Frontend

Angular storefront for the BookNest platform. Deploy this repo on [Vercel](https://vercel.com).

## Local development

```bash
npm install
npm start
```

App runs at `http://localhost:4200`. API calls use `src/environments/environment.ts` (`apiUrl: http://localhost:8080`).

## Deploy on Vercel

1. Import this GitHub repository in Vercel.
2. Framework preset: **Angular** (or use defaults from `vercel.json`).
3. Add environment variables (Project → Settings → Environment Variables):
   - `API_URL` — your API gateway URL (e.g. `https://api.yourdomain.com`)
   - `RAZORPAY_KEY_ID` — Razorpay key (optional, for payments)
4. Deploy. The build runs `node scripts/write-env.js` then `ng build`, and serves `dist/frontend/browser`.

## Project structure

```
src/app/          # Components, pages, services
src/environments/ # API URL config (prod generated at build)
public/           # Static assets
```

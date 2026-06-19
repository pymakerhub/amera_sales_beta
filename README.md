# Amera Salesboard Beta

Static React + TypeScript beta for an Amera sales reporting and leaderboard system. It is inspired by the old PHP/MySQL reporting app conceptually, but it does not deploy, copy, or depend on the old app.

## Demo Login Notice

This beta uses front-end-only mock login with dummy credentials stored in code. It is only suitable for demos on GitHub Pages and must not be used for real private data, real sales, customer information, or secure authentication.

Test users:

| User | Username | Password | Role |
| --- | --- | --- | --- |
| Axel | `axel` | `beta123` | admin |
| Aleksander | `aleksander` | `beta123` | admin |
| Luis | `luis` | `beta123` | admin |
| Ingrid | `ingrid` | `beta123` | team_leader |
| Emil | `emil` | `beta123` | sales_rep |

## What It Includes

- Mock admin login
- Main KPI dashboard with Amera Points, sales, budgets, and filters
- My Sales page with future sales-rep scoping
- Team Leader page with future team-leader scoping
- Admin All Sales table with search and export placeholder
- Hall of Fame leaderboards by yesterday, current day, week, month, year, and all time
- Current App Overview explaining the old PHP app concepts reused
- Dummy teams, reps, statuses, orders, point budgets, products, transition products, marketing types, and comments

## Amera-Point System

Competitions and leaderboards are measured by Amera Points:

| Item | Points |
| --- | ---: |
| Neutral | 1 |
| SpeedUp | 2 |
| ContentUp | 2 |
| LayerUp | 3 |
| NK | +5 |
| GK | +3 |
| NVM / RVM Fiber Neu | +5 |

Examples:

VVM NK without UP = 5 Amera Points

VVM NK with UP Speedup = 7 Amera Points

NVM NK = 10 Amera points (NK + NVM Fiber Neu)

NVM Fiber Neu Neutral = 6 Amera Points (NVM Fiber Neu + BK Neutral)

NVM GK NK Fiber Neu =13 Amera Points

Leaderboard rep names are shortened to first name plus last initial for privacy.

## Run Locally

```bash
npm install
npm run dev
```

Build for static hosting:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deploy To GitHub Pages

1. Push this repository to GitHub.
2. Run `npm run build`.
3. Deploy the `dist` folder with your preferred GitHub Pages flow.
4. If using GitHub Actions, install dependencies, run the build, and publish `dist`.

The Vite config uses `base: './'` so the app can be served from a repository subpath on GitHub Pages.

## Next Steps For Production

- Replace mock login with real authentication through Supabase, Firebase, or a custom API.
- Move dummy data to a database with server-side authorization rules.
- Enforce role permissions on the backend, not only in React.
- Add real export, audit logging, and data import workflows.
- Add secure password reset and account management.

## Security Boundary

No files from the old ZIP are included in this project. Do not add PHP credentials, `db.php`, SSL keys, logs, cache files, AWStats files, server backups, real customer data, or real sales records.

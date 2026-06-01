# Savings Manager

Track your savings balances across banks and brokers in two currencies (base + GBP).

## Requirements

- Node.js 18 or later
- npm

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Data storage

Your data is stored locally in the `data/` folder:

- `data/savings.csv` — all savings entries
- `data/settings.json` — currency settings

These files are created automatically on first run. Back them up to keep your data safe.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |

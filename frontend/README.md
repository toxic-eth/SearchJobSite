# QuickGigWeb Frontend

Stack:
- React
- TypeScript
- Vite

## Run locally
```bash
npm install
npm run dev
```

By default app expects backend API at `http://127.0.0.1:8000/api`.
Override with `.env`:
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Build
```bash
npm run build
```

## Next implementation step
- Worker discovery (map/list, filters, apply)
- Employer shift wizard
- i18n + design tokens

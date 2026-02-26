# QuickGigWeb

Веб-версия QuickGig (worker + employer).

## Repository layout
- `backend/` — Laravel API (auth, shifts, applications, reviews)
- `frontend/` — React + TypeScript + Vite SPA
- `docs/` — продуктовая и техническая документация

## Current status
- Backend baseline перенесен и готов к запуску.
- Frontend scaffold создан и зависимости установлены.
- Локальная разработка готова.

## Quick start

### 1) Backend
```bash
cd backend
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan serve
```

API URL: `http://127.0.0.1:8000/api`

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Vite URL: `http://127.0.0.1:5173`

## Useful checks
```bash
# backend tests
cd backend && php artisan test

# frontend production build
cd frontend && npm run build
```

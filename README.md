# QuickGigWeb

Веб-версия QuickGig (worker + employer).

## Repository layout
- `backend/` — Laravel API (auth, shifts, applications, reviews)
- `frontend/` — SPA frontend (под React/TypeScript, bootstrap pending)
- `docs/` — продуктовая и техническая документация

## Current status
- Backend baseline перенесен из текущего проекта.
- Отдельный git-репозиторий инициализирован.
- Frontend scaffold ожидает установку Node.js/npm.

## Local run (backend)
```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

## Required to continue frontend
Install Node.js 20+ (includes npm), then bootstrap:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

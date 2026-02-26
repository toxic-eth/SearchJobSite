# QuickGig Web Execution Roadmap

Last update: 2026-02-26
Source baseline: `WEB_COMPETITOR_ANALYSIS_2026-02-26.md`

## Release target
Запуск production-ready web MVP для України с разделением ролей worker/employer.

## Phase 0 — Product & Legal Baseline (P0)
- [ ] Утвердить ICP по 2 ролям (worker/employer) и JTBD
- [ ] Финализировать UA legal package (Privacy, Terms, Support, data processing)
- [ ] Определить SLA поддержки и споров
- [ ] Зафиксировать KPI релиза (Activation, Apply rate, Completion rate, Dispute rate)

Exit criteria:
- все legal URL публичны;
- SLA и KPI приняты и задокументированы.

## Phase 1 — Platform Foundation (P0)
- [x] Backend API contract v1 (OpenAPI/Swagger)
- [x] Ролевая phone auth + session/token hardening
- [x] CORS, rate limit, audit logging, error model
- [ ] Frontend shell: routing, role guards, i18n (uk/ru/en), theme tokens

Exit criteria:
- worker/employer могут зарегистрироваться и войти;
- единая схема ошибок и логирования в проде.

Status note (2026-02-26):
- Реализованы web auth + role guards + token restore/logout.
- Инициализирован API health-check и CORS для web origin.
- Для полной готовности Phase 1 осталось: i18n (uk/ru/en) и theme token system.

## Phase 2 — Worker Discovery Core (P0)
- [x] Главный экран worker: map/list toggle
- [x] Search + фильтры (оплата, дата/время, формат, дистанция)
- [x] Геолокация и корректный distance filter от user location
- [x] Карточка смены: условия, адрес, рейтинг работодателя, слотность
- [x] Apply flow (1-click + підтвердження)

Exit criteria:
- новый worker доходит до первого отклика <= 3 мин;
- фильтры влияют на выдачу детерминированно и проверяемо.

Status note (2026-02-26):
- Реализованы worker discovery list/map, фильтры и apply flow.
- Backend-DTO расширен: address, work_format, required_workers, employer.rating/reviews_count.

## Phase 3 — Employer Posting Core (P0)
- [x] Wizard создания смены (role/pay/time/address/slots)
- [ ] Выбор адреса: geocode + pin-on-map
- [ ] Управление сменой: edit/close/reopen
- [x] Воронка заявок: pending/accepted/rejected
- [ ] Базовая аналитика смены (views -> applies -> confirmed)

Exit criteria:
- работодатель публикует смену <= 5 мин;
- смена отображается в worker discovery без ручных операций.

Status note (2026-02-26):
- Реализованы создание смены и управление статусами заявок из web-кабинета работодателя.
- Для завершения Phase 3 осталось: map-based geocode picker, edit/close/reopen, conversion analytics.

## Phase 4 — Execution, Trust, Reviews (P0)
- [ ] Shift lifecycle: scheduled -> in progress -> completed
- [ ] Гео check-in/check-out (радиус + контроль антифрода)
- [ ] Отзывы только после completed для обеих сторон
- [ ] Рейтинг/надежность (completion, cancel, no-show)
- [ ] Dispute ticket v1 + статус + SLA таймер

Exit criteria:
- есть traceable история выполнения смены;
- отзыв нельзя оставить без факта сотрудничества.

## Phase 5 — Communication & Notifications (P1)
- [ ] Chat worker<->employer по смене
- [ ] Notification center (in-app + email)
- [ ] Настройки уведомлений по категориям
- [ ] Anti-spam caps и relevance rules

Exit criteria:
- коммуникация закрывается внутри продукта;
- нет flood-уведомлений по системным тестам.

## Phase 6 — Ops, QA, Release (P0)
- [ ] E2E smoke suite для критических сценариев
- [ ] Monitoring: API latency/error rate, auth failures, payout/dispute alerts
- [ ] Release checklist и rollback plan
- [ ] Staging -> production rollout c post-release watch (72h)

Exit criteria:
- критические сценарии проходят E2E;
- observability покрывает auth/discovery/execution/disputes.

## KPI targets for MVP
- Activation (register -> first apply in 24h): >= 35%
- Apply->Accept conversion: >= 20%
- Completed shifts / accepted: >= 80%
- Dispute rate: <= 3%
- Median time-to-fill shift: <= 24h

## Backlog (post-MVP)
- [ ] Real-time WebSocket chat with delivery guarantees
- [ ] Payout wallet and reconciliation dashboard
- [ ] Employer KYC кабинет и moderation console
- [ ] Recommendation ranking model

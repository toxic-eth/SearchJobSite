# QuickGig Web Competitor Analysis (UA + Global)

Date: 2026-02-26
Scope: конкуренты в веб-сегменте краткосрочной занятости и job marketplace

## 1) Кого анализировали
- Work.ua (UA): [work.ua/services](https://www.work.ua/services/)
- Robota.ua (UA): [about.robota.ua](https://about.robota.ua/)
- Jooble (UA/global): [jooble.org](https://jooble.org/) + [design upgrade](https://jooble.org/insights/joobles-design-upgrade/) + [Trustpilot](https://www.trustpilot.com/review/jooble.org)
- Instawork (US/CA gig staffing): [instawork how it works](https://www.instawork.com/how-it-works) + [Trustpilot](https://www.trustpilot.com/review/instawork.com)
- Shiftsmart (US gig staffing): [check-in/out policy](https://help.shiftsmart.com/hc/en-us/articles/29335585594260-How-to-check-in-and-out-at-a-store), [instant payout](https://help.shiftsmart.com/hc/en-us/articles/29224511930132-Instant-pay-out-and-automatic-transfer), [Trustpilot](https://www.trustpilot.com/review/www.shiftsmart.com)

## 2) Лучшие решения, которые стоит забрать

### A. Discovery и навигация
- Jooble: фильтры прямо под строкой поиска, быстрый доступ к ключевым разделам (favorites/salary/subscriptions).
- Work.ua: понятная модель «вакансия + промо-пакеты», прозрачная монетизация для работодателя.
- Решение для QuickGig Web:
  - sticky search bar;
  - filters chip-row сразу под поиском;
  - map/list toggle в одном клике;
  - сохраненные фильтры и избранные смены.

### B. Доверие и выполнение смены
- Instawork: vetting, рейтинги, on-time/cancel tracking, GPS clock-ins, backup workers.
- Shiftsmart: гео-ограничение check-in/out по радиусу и код подтверждения от менеджера.
- Решение для QuickGig Web:
  - check-in/out только в георадиусе;
  - manager code / QR для старта и завершения смены;
  - SLA по спорным выплатам и сменам;
  - reliability score обеих сторон.

### C. Коммуникация и уведомления
- Work.ua: многоканальные уведомления (Telegram/Viber/email).
- Решение для QuickGig Web:
  - in-app + email + Telegram канал уведомлений;
  - granular notification settings (new shifts, replies, payment, disputes).

### D. Воронка работодателя
- Work.ua/Robota.ua: понятный flow для компании (профиль -> вакансия -> отклики -> контакты).
- Решение для QuickGig Web:
  - wizard создания смены (роль, оплата, время, адрес, требования, количество мест);
  - шаблоны смен и быстрый репост;
  - dashboard по эффективности (views -> applies -> confirmed -> completed).

## 3) Повторяющиеся проблемы конкурентов (по отзывам)

### A. Спам и нерелевантные уведомления
- По отзывам Jooble на Trustpilot встречаются жалобы на слишком частые и нерелевантные письма.
- Для QuickGig: строгий frequency cap + relevance scoring + one-click unsubscribe по категории.

### B. Выплаты и слабая поддержка
- По отзывам Shiftsmart/Instawork на Trustpilot: частые претензии по задержкам выплат, AI-only support, долгим ответам.
- Для QuickGig: живой escalation (human support), SLA, статус тикета в реальном времени, прозрачный payout ledger.

### C. Технические сбои в critical path
- В отзывах повторяются проблемы check-in/out, логина, подтверждений смен.
- Для QuickGig: защита critical flow (idempotency, retry, offline-safe drafts), аудит событий смены.

## 4) Продуктовые принципы для QuickGig Web
- Принцип 1: “Fast to first shift” — новый worker должен найти и откликнуться <= 3 минут.
- Принцип 2: “Trust by default” — прозрачные условия, верификация и trackable выполнение.
- Принцип 3: “No black box support” — по платежам и спорам всегда понятный статус и дедлайн.
- Принцип 4: “Role-native UX” — у worker и employer разные домашние экраны и метрики.

## 5) Что фиксируем как обязательные требования к MVP сайта
- Ролевая регистрация и phone auth.
- Карта + список + фильтры + distance.
- Публикация смены с реальным адресом и геопином.
- Отклик, подтверждение, check-in/out, завершение.
- Отзывы только после completed.
- Центр уведомлений + базовая поддержка.

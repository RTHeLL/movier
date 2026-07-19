# Movier

Расширение Chromium и сайт для поиска и просмотра с Кинопоиска.

## Структура

- `extension/` — расширение (Manifest V3)
- `web/` — сайт (Vite)
- `server/` — API
- `filters/` — списки блокировки рекламы
- `deploy/` — Docker Compose + Caddy
- `store/` — тексты и чеклист для Chrome Web Store
- `dist/movier-extension.zip` — production-архив после `npm run pack:extension`

## Локальный запуск

```bash
# API
cd server
cp .env.example .env   # задайте KP_API_KEY
npm install && npm run dev

# Сайт (другой терминал)
cd web
npm install && npm run dev
```

Ключ API: [kinopoiskapiunofficial.tech](https://kinopoiskapiunofficial.tech/).  
Vite проксирует `/api` и `/filters` на `http://127.0.0.1:8787`.

## Деплой (VPS)

```bash
cd deploy
cp .env.example .env   # SITE_DOMAIN, ACME_EMAIL, KP_API_KEY, CORS_ORIGINS
docker compose up -d --build
```

Удалённое обновление DNR в расширении (только allowlist URL, по умолчанию `https://kurduk.store`):

```js
chrome.storage.local.set({ filtersBaseUrl: 'https://kurduk.store' })
```

Подписка uBlock/AdGuard: `https://ваш-домен/filters/movier.txt`

## Расширение

Разработка: `chrome://extensions/` → режим разработчика → загрузить папку `extension/`.

Production-пакет для Chrome Web Store и ручной установки:

```bash
npm run pack:extension
```

Артефакты:
- `dist/movier-extension.zip` — локальная сборка
- `releases/extension/` — файлы в репозитории GitHub (ZIP + unpacked)
- `web/public/extension/` — скачивание с сайта

Инструкция на сайте: https://kurduk.store/#/install  
Политика конфиденциальности: https://kurduk.store/privacy.html  
Материалы витрины: `store/STORE_LISTING.md`

## API

| Метод | Путь |
|-------|------|
| GET | `/api/health` |
| GET | `/api/kp/top?page=` |
| GET | `/api/kp/search?keyword=&page=` |
| GET | `/api/kp/films/:id` |
| POST | `/api/players` |
| GET | `/filters/movier.txt` |
| GET | `/filters/movier-dnr.json` |

## GitHub Pages

**Settings → Pages → Source → GitHub Actions**

С кастомным доменом сайт на корне: `https://kurduk.store/` (не `/movier/`).  
`https://rthell.github.io/movier/` после смены base тоже будет вести на корень репозитория Pages.

Секреты:
- `VITE_KP_API_KEY` — поиск/топ с Pages
- `VITE_API_BASE` — URL API на VPS (если есть)

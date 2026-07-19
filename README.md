# Movier

Расширение Chromium и сайт для поиска и просмотра с Кинопоиска.

## Структура

- `extension/` — расширение
- `web/` — сайт (Vite)
- `server/` — API
- `filters/` — списки блокировки рекламы
- `deploy/` — Docker Compose + Caddy

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

Удалённое обновление DNR в расширении:

```js
chrome.storage.local.set({ filtersBaseUrl: 'https://ваш-домен' })
```

Подписка uBlock/AdGuard: `https://ваш-домен/filters/movier.txt`

## Расширение

`chrome://extensions/` → режим разработчика → загрузить папку `extension/`.

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

В настройках репозитория: **Settings → Pages → Source → GitHub Actions**  
(не «Deploy from a branch» / папка `docs` — из‑за этого падает Jekyll).

Секрет `VITE_API_BASE` — публичный URL API. Сборка кладёт сайт в `docs/` с `.nojekyll`.

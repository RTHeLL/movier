# Changelog — Movier Extension

## 1.3.0 — 2026-07-19

### Chrome Web Store readiness
- Manifest V3: сужены `host_permissions` (убраны `http://*/*` / `https://*/*`)
- Запрос плееров через service worker на `kp.apiget.ru` (без CORS со страницы)
- Прекращена отправка полного HTML страницы и cookie Кинопоиска
- Явное согласие + Privacy Policy (`https://kurduk.store/privacy.html`)
- Удалён jQuery (~300 KB); vanilla content scripts
- Popup и Options; иконки 16/48/128
- Remote DNR только с allowlist базовых URL
- Убран глобальный override `window.open`
- Санитизация URL плееров перед вставкой iframe
- `npm run pack:extension` / `validate:extension` / CI artifact

### Совместимость API
- Клиентская версия для upstream API: `16.2.3` (как у Kinopoisk Player)
- Версия пакета CWS: `1.3.0`

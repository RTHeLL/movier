# Changelog — Movier Extension

## 1.3.1 — 2026-07-19

- Убран обязательный content script на `http://*/*` / `https://*/*` (предупреждение CWS о broad host access)
- Сетевая блокировка рекламы через declarativeNetRequest без изменений
- Element-hiding во фреймах плееров — опционально в настройках (optional_host_permissions + scripting)

## 1.3.0 — 2026-07-19

### Chrome Web Store readiness
- Manifest V3: сужены обязательные `host_permissions`
- Запрос плееров через service worker на `kp.apiget.ru`
- Без отправки полного HTML страницы и cookie Кинопоиска
- Согласие + Privacy Policy
- Удалён jQuery; popup/options; pack/CI

### Совместимость API
- Клиентская версия для upstream API: `16.2.3`

# Материалы для Chrome Web Store — Movier

## Название

Movier

## Краткое описание (≤ 132 символа)

Плееры на страницах Кинопоиска и блокировка рекламы в плеерах.

## Полное описание

Movier — расширение для Chromium, которое добавляет на страницы фильмов и сериалов Кинопоиска кнопку быстрого доступа к онлайн-плеерам и снижает количество рекламы внутри плееров.

Возможности:
• кнопка «Смотреть бесплатно!» на страницах kinopoisk.ru/film и /series;
• несколько вкладок плееров, если сервис возвращает несколько источников;
• сетевая блокировка рекламы (declarativeNetRequest) и скрытие типичных рекламных блоков во фреймах плееров;
• автоматическое обновление правил фильтров с kurduk.store;
• редирект со страниц hd.kinopoisk.ru обратно к карточке на www.kinopoisk.ru.

Как пользоваться:
1. Установите расширение и примите условия на странице настроек.
2. Откройте фильм или сериал на www.kinopoisk.ru.
3. Нажмите «Смотреть бесплатно!» и выберите плеер.

Конфиденциальность: https://kurduk.store/privacy.html
Сайт: https://kurduk.store/

Список плееров предоставляет сторонний сервис kp.apiget.ru. Расширение передаёт только ID материала и технические идентификаторы; полный HTML страницы и cookie Кинопоиска не отправляются.

## Категория

Fun (Для удовольствия)

## Single purpose (поле в Dashboard)

Добавление онлайн-плееров на страницы фильмов/сериалов Кинопоиска и блокировка рекламы в этих плеерах.

## Язык

Русский (ru)

## Privacy practice (Dashboard)

Отметить сбор:
• Personally identifiable information — да (технические псевдонимные ID расширения)

Утверждения:
• Not sold to third parties, except for allowed use cases
• Not used or transferred for purposes unrelated to the item’s core functionality
• Not used or transferred for determining creditworthiness or for lending purposes

Privacy policy URL: https://kurduk.store/privacy.html

Host permission justification см. ниже.

## Permission justifications

### storage
Хранение технических ID, флага согласия на политику конфиденциальности и URL сервера фильтров рекламы.

### alarms
Периодическое обновление remote DNR-правил блокировки рекламы (раз в 6 часов).

### declarativeNetRequest
Блокировка рекламных доменов и трекеров в сетевых запросах плееров по статическим и обновляемым правилам.

### Host permission: https://kp.apiget.ru/*
Запрос списка iframe-плееров по ID фильма/сериала (основная функция расширения).

### Host permission: https://kurduk.store/*
Загрузка JSON-правил фильтров рекламы и открытие политики конфиденциальности.

### Host permission: https://rthell.github.io/*
Запасной источник фильтров при публикации через GitHub Pages.

### Content scripts на kinopoisk.ru
Встраивание кнопки и UI плееров только на страницах фильмов/сериалов.

### Content scripts на http(s)://*/* (all_frames)
Element-hiding рекламы во фреймах плееров (плееры загружаются с разных доменов). Не используется для сбора данных со всех сайтов.

## Remote code / remote data

Удалённый JavaScript не выполняется. Загружаются:
• JSON конфигурация DNR-правил;
• URL iframe плееров (изолированный контекст iframe, sandbox).

## Скриншоты (подготовить 3–5 шт., 1280×800)

1. Страница фильма на Кинопоиске с кнопкой «Смотреть бесплатно!» в шапке.
2. Открытая панель с вкладками плееров и воспроизведением.
3. Экран согласия / политика перед первой загрузкой.
4. Страница настроек расширения (согласие + filtersBaseUrl).
5. (опционально) Popup расширения с подсказкой.

## Promotional images

Обязательно:
• Small tile — 440×280 PNG/JPEG, бренд Movier, без мелкого текста.

Опционально:
• Marquee — 1400×560 для feature.

Large tile в актуальной документации CWS не требуется.

## Иконки в пакете

• 16.png, 48.png, 128.png (128 с прозрачным padding ~16px)

## Версия пакета

См. extension/manifest.json (сейчас 1.3.0).

## Changelog 1.3.0

Подготовка к публикации в Chrome Web Store: Manifest V3 hardening, минимальные host permissions, согласие и Privacy Policy, запрос плееров через service worker без передачи HTML/cookie страницы, удаление jQuery, popup/options, remote DNR только с allowlist URL, production pack и CI-проверки.

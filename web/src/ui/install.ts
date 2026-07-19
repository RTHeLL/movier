import { el } from '../dom'
import { navigate } from '../router'

const GITHUB_REPO = 'https://github.com/RTHeLL/movier'
const GITHUB_RELEASES_DIR = `${GITHUB_REPO}/tree/main/releases/extension`
const GITHUB_ZIP_RAW = `${GITHUB_REPO}/raw/main/releases/extension/movier-extension.zip`
const GITHUB_UNPACKED = `${GITHUB_REPO}/tree/main/releases/extension/unpacked`

type ExtensionMeta = {
  version: string
  updated?: string
  zip: string
  files?: number
}

function siteBase(): string {
  return import.meta.env.BASE_URL
}

function extensionZipUrl(): string {
  return `${siteBase()}extension/movier-extension.zip`
}

function extensionMetaUrl(): string {
  return `${siteBase()}extension/version.json`
}

async function loadMeta(): Promise<ExtensionMeta | null> {
  try {
    const res = await fetch(extensionMetaUrl(), { cache: 'no-cache' })
    if (!res.ok) return null
    return (await res.json()) as ExtensionMeta
  } catch {
    return null
  }
}

function step(n: number, title: string, body: HTMLElement): HTMLElement {
  const item = el('li', 'install-step')
  const num = el('span', 'install-step-num', String(n))
  const content = el('div', 'install-step-body')
  content.append(el('h3', 'install-step-title', title), body)
  item.append(num, content)
  return item
}

function para(...nodes: (string | Node)[]): HTMLElement {
  const p = el('p', 'install-p')
  p.append(...nodes)
  return p
}

function code(text: string): HTMLElement {
  const c = document.createElement('code')
  c.textContent = text
  return c
}

function link(href: string, text: string, className?: string): HTMLAnchorElement {
  const a = document.createElement('a')
  a.href = href
  a.textContent = text
  a.rel = 'noopener noreferrer'
  if (className) a.className = className
  if (href.startsWith('http')) a.target = '_blank'
  return a
}

export async function renderInstallPage(container: HTMLElement): Promise<void> {
  const meta = await loadMeta()
  const versionLabel = meta?.version ? `v${meta.version}` : 'актуальная версия'

  const back = el('p', 'back-link')
  const backBtn = el('button', 'btn btn-ghost', '← На главную')
  backBtn.type = 'button'
  backBtn.addEventListener('click', () => navigate('/'))
  back.appendChild(backBtn)

  const hero = el('section', 'install-hero')
  hero.append(
    el('p', 'install-kicker', 'Расширение Chrome / Edge / Chromium'),
    el('h1', 'install-title', 'Установка Movier вручную'),
    el(
      'p',
      'install-lead',
      'Пока расширения нет в Chrome Web Store (или вы хотите поставить напрямую с GitHub), загрузите пакет и установите его в режиме разработчика.',
    ),
  )

  const metaLine = el('p', 'install-meta')
  metaLine.append(
    document.createTextNode(`Пакет: ${versionLabel}`),
    document.createTextNode(meta?.updated ? ` · обновлён ${meta.updated}` : ''),
  )
  hero.appendChild(metaLine)

  const downloads = el('div', 'install-downloads')
  const primary = link(extensionZipUrl(), 'Скачать ZIP с сайта', 'btn btn-primary')
  primary.setAttribute('download', 'movier-extension.zip')
  const githubZip = link(GITHUB_ZIP_RAW, 'Скачать ZIP с GitHub', 'btn btn-ghost')
  const browse = link(GITHUB_RELEASES_DIR, 'Папка releases на GitHub', 'btn btn-ghost')
  downloads.append(primary, githubZip, browse)
  hero.appendChild(downloads)

  const note = el('p', 'install-note')
  note.append(
    document.createTextNode(
      'Файлы хранятся в репозитории GitHub и публикуются на сайт при деплое. Распакованная сборка: ',
    ),
    link(GITHUB_UNPACKED, 'releases/extension/unpacked'),
    document.createTextNode('.'),
  )

  const stepsTitle = el('h2', 'section-title', 'Пошаговая инструкция')
  const list = el('ol', 'install-steps')

  const s1 = el('div')
  s1.append(
    para(
      'Нажмите «Скачать ZIP» выше (с сайта или с GitHub). Файл: ',
      code('movier-extension.zip'),
      '.',
    ),
  )
  list.appendChild(step(1, 'Скачайте пакет', s1))

  const s2 = el('div')
  s2.append(
    para(
      'Распакуйте архив в любую постоянную папку, например ',
      code('C:\\Apps\\movier-extension'),
      ' или ',
      code('~/Applications/movier-extension'),
      '. Не удаляйте эту папку после установки — Chrome читает файлы оттуда.',
    ),
  )
  list.appendChild(step(2, 'Распакуйте архив', s2))

  const s3 = el('div')
  s3.append(
    para('Откройте ', code('chrome://extensions'), ' (в Edge — ', code('edge://extensions'), ').'),
    para('Включите «Режим разработчика» (переключатель справа вверху).'),
    para(
      'Нажмите «Загрузить распакованное расширение» и выберите папку, в которой лежит ',
      code('manifest.json'),
      ' (содержимое архива, не сам ZIP).',
    ),
  )
  list.appendChild(step(3, 'Загрузите в браузер', s3))

  const s4 = el('div')
  s4.append(
    para(
      'Откройте страницу фильма или сериала на ',
      link('https://www.kinopoisk.ru/', 'kinopoisk.ru'),
      ' и нажмите «Смотреть бесплатно!». При первом запуске подтвердите согласие в панели расширения.',
    ),
    para(
      'Настройки и политика: кнопка расширения → «Настройки», либо ',
      link(`${siteBase()}privacy.html`, 'политика конфиденциальности'),
      '.',
    ),
  )
  list.appendChild(step(4, 'Проверьте работу', s4))

  const updateCard = el('section', 'install-card')
  updateCard.append(
    el('h2', 'section-title', 'Обновление'),
    para(
      'Скачайте новый ZIP, замените файлы в папке расширения и нажмите «Обновить» на карточке Movier в ',
      code('chrome://extensions'),
      '. Либо удалите старое расширение и загрузите папку заново.',
    ),
  )

  const altCard = el('section', 'install-card')
  altCard.append(
    el('h2', 'section-title', 'Через клон репозитория'),
    para(
      'Если вы разработчик: ',
      code('git clone'),
      ' репозитория и загрузите папку ',
      code('releases/extension/unpacked'),
      ' или исходники ',
      code('extension/'),
      ' (для разработки). Готовый пакет для пользователей — ZIP в ',
      link(GITHUB_RELEASES_DIR, 'releases/extension'),
      '.',
    ),
    para(link(GITHUB_REPO, 'github.com/RTHeLL/movier', 'btn btn-ghost')),
  )

  container.append(back, hero, note, stepsTitle, list, updateCard, altCard)
}

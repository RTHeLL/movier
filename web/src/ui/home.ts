import { KpApiError, searchByKeyword } from '../api/kp-unofficial'
import { navigate } from '../router'

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

export async function renderHomePage(container: HTMLElement): Promise<void> {
  const header = el('header', 'site-header')
  const title = el('h1', 'site-title', 'Movier')
  const subtitle = el(
    'p',
    'site-subtitle',
    'Поиск по Кинопоиску и просмотр. Введите название или ID фильма.',
  )
  header.append(title, subtitle)

  const searchRow = el('div', 'search-row')
  const input = document.createElement('input')
  input.type = 'search'
  input.className = 'search-input'
  input.placeholder = 'Название или числовой ID…'
  input.setAttribute('autocomplete', 'off')
  input.setAttribute('aria-label', 'Поиск фильма')

  const btnSearch = el('button', 'btn btn-primary', 'Найти')
  btnSearch.type = 'button'
  const btnById = el('button', 'btn btn-ghost', 'Открыть по ID')
  btnById.type = 'button'
  btnById.title = 'Если введён только номер — перейти на страницу фильма'

  searchRow.append(input, btnSearch, btnById)

  const status = el('div', 'status-message')
  const results = el('div', 'results-grid')

  container.append(header, searchRow, status, results)

  const showStatus = (msg: string, kind: 'info' | 'error' | '') => {
    status.textContent = msg
    status.className = 'status-message' + (kind ? ` status-${kind}` : '')
  }

  const runSearch = async (page = 1) => {
    const q = input.value.trim()
    if (!q) {
      showStatus('Введите запрос.', 'error')
      return
    }

    if (/^\d+$/.test(q)) {
      showStatus(
        'Похоже на ID. Нажмите «Открыть по ID» или уточните название для поиска.',
        'info',
      )
    }

    showStatus('Загрузка…', 'info')
    results.innerHTML = ''

    try {
      const data = await searchByKeyword(q, page)
      showStatus(
        data.films.length === 0
          ? 'Ничего не найдено.'
          : `Найдено: страница ${page} из ${data.pagesCount}`,
        data.films.length === 0 ? 'info' : '',
      )

      for (const f of data.films) {
        const card = el('article', 'film-card')
        card.tabIndex = 0
        card.setAttribute('role', 'button')

        const poster = el('div', 'film-card-poster')
        if (f.posterUrlPreview) {
          const img = document.createElement('img')
          img.src = f.posterUrlPreview
          img.alt = ''
          img.loading = 'lazy'
          poster.appendChild(img)
        } else {
          poster.textContent = 'Нет постера'
        }

        const body = el('div', 'film-card-body')
        const name =
          f.nameRu || f.nameEn || `Фильм #${f.filmId}`
        const h2 = el('h2', 'film-card-title', name)
        const meta = el(
          'p',
          'film-card-meta',
          [f.year, f.type, f.rating ? `★ ${f.rating}` : '']
            .filter(Boolean)
            .join(' · '),
        )
        body.append(h2, meta)
        card.append(poster, body)

        const go = () => navigate(`/film/${f.filmId}`)
        card.addEventListener('click', go)
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            go()
          }
        })

        results.appendChild(card)
      }

      if (data.pagesCount > 1) {
        const pager = el('div', 'pager')
        if (page > 1) {
          const prev = el('button', 'btn btn-ghost', 'Назад')
          prev.type = 'button'
          prev.addEventListener('click', () => void runSearch(page - 1))
          pager.appendChild(prev)
        }
        if (page < data.pagesCount) {
          const next = el('button', 'btn btn-ghost', 'Дальше')
          next.type = 'button'
          next.addEventListener('click', () => void runSearch(page + 1))
          pager.appendChild(next)
        }
        results.appendChild(pager)
      }
    } catch (e) {
      if (e instanceof KpApiError) {
        showStatus(e.message, 'error')
      } else {
        showStatus('Неизвестная ошибка.', 'error')
      }
    }
  }

  btnSearch.addEventListener('click', () => void runSearch(1))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void runSearch(1)
  })

  btnById.addEventListener('click', () => {
    const q = input.value.trim()
    if (/^\d+$/.test(q)) {
      navigate(`/film/${q}`)
      return
    }
    showStatus('Для открытия по ID введите только число.', 'error')
  })
}

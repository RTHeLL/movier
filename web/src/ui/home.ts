import {
  ApiError,
  fetchTop,
  filterListSubscribeUrl,
  searchByKeyword,
} from '../api/client'
import { el } from '../dom'
import { navigate } from '../router'
import { renderFilmCards } from './cards'
import { renderInstallBanner } from './install-banner'

export async function renderHomePage(container: HTMLElement): Promise<void> {
  const header = el('header', 'site-header')

  const brand = el('div', 'site-brand')
  const logo = document.createElement('img')
  logo.className = 'site-logo'
  logo.src = `${import.meta.env.BASE_URL}logo.png`
  logo.alt = 'Movier'
  logo.width = 48
  logo.height = 48
  brand.append(logo, el('h1', 'site-title', 'Movier'))
  header.append(brand, el('p', 'site-subtitle', 'Поиск и просмотр.'))

  renderInstallBanner(header)

  const filtersHint = el('p', 'site-filters-hint')
  const filtersLink = document.createElement('a')
  filtersLink.href = filterListSubscribeUrl()
  filtersLink.textContent = 'фильтры рекламы'
  filtersLink.rel = 'noopener noreferrer'
  const privacyLink = document.createElement('a')
  privacyLink.href = `${import.meta.env.BASE_URL}privacy.html`
  privacyLink.textContent = 'конфиденциальность'
  privacyLink.rel = 'noopener noreferrer'
  const installLink = document.createElement('a')
  installLink.href = '#/install'
  installLink.textContent = 'установка расширения'
  filtersHint.append(
    document.createTextNode('uBlock: '),
    filtersLink,
    document.createTextNode(' · '),
    privacyLink,
    document.createTextNode(' · '),
    installLink,
  )
  header.append(filtersHint)

  const searchRow = el('div', 'search-row')
  const input = document.createElement('input')
  input.type = 'search'
  input.className = 'search-input'
  input.placeholder = 'Название или ID'
  input.setAttribute('autocomplete', 'off')
  input.setAttribute('aria-label', 'Поиск')

  const btnSearch = el('button', 'btn btn-primary', 'Найти')
  btnSearch.type = 'button'
  const btnById = el('button', 'btn btn-ghost', 'По ID')
  btnById.type = 'button'
  const btnTop = el('button', 'btn btn-ghost', 'Топ')
  btnTop.type = 'button'
  searchRow.append(input, btnSearch, btnById, btnTop)

  const sectionTitle = el('h2', 'section-title', 'Популярное')
  const status = el('div', 'status-message')
  const results = el('div', 'results-grid')
  container.append(header, searchRow, sectionTitle, status, results)

  let lastQuery = ''

  const showStatus = (msg: string, kind: 'info' | 'error' | '') => {
    status.textContent = msg
    status.className = 'status-message' + (kind ? ` status-${kind}` : '')
  }

  const renderPager = (
    page: number,
    pagesCount: number,
    onPage: (p: number) => void,
  ) => {
    if (pagesCount <= 1) return
    const pager = el('div', 'pager')
    if (page > 1) {
      const prev = el('button', 'btn btn-ghost', 'Назад')
      prev.type = 'button'
      prev.addEventListener('click', () => onPage(page - 1))
      pager.appendChild(prev)
    }
    pager.appendChild(el('span', 'pager-label', `${page} / ${pagesCount}`))
    if (page < pagesCount) {
      const next = el('button', 'btn btn-ghost', 'Дальше')
      next.type = 'button'
      next.addEventListener('click', () => onPage(page + 1))
      pager.appendChild(next)
    }
    results.appendChild(pager)
  }

  const loadTop = async (page = 1) => {
    sectionTitle.textContent = 'Популярное'
    showStatus('Загрузка…', 'info')
    results.innerHTML = ''
    try {
      const data = await fetchTop(page)
      showStatus(
        data.films.length === 0 ? 'Пусто.' : `${page} / ${data.pagesCount}`,
        data.films.length === 0 ? 'info' : '',
      )
      renderFilmCards(results, data.films)
      renderPager(page, data.pagesCount, (p) => void loadTop(p))
    } catch (e) {
      showStatus(e instanceof ApiError ? e.message : 'Ошибка.', 'error')
    }
  }

  const runSearch = async (page = 1) => {
    const q = input.value.trim()
    if (!q) {
      showStatus('Введите запрос.', 'error')
      return
    }
    lastQuery = q
    sectionTitle.textContent = `«${q}»`
    showStatus('Загрузка…', 'info')
    results.innerHTML = ''
    try {
      const data = await searchByKeyword(q, page)
      showStatus(
        data.films.length === 0
          ? 'Ничего не найдено.'
          : `${page} / ${data.pagesCount}`,
        data.films.length === 0 ? 'info' : '',
      )
      renderFilmCards(results, data.films)
      renderPager(page, data.pagesCount, (p) => {
        input.value = lastQuery
        void runSearch(p)
      })
    } catch (e) {
      showStatus(e instanceof ApiError ? e.message : 'Ошибка.', 'error')
    }
  }

  btnSearch.addEventListener('click', () => void runSearch(1))
  btnTop.addEventListener('click', () => {
    input.value = ''
    void loadTop(1)
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void runSearch(1)
  })
  btnById.addEventListener('click', () => {
    const q = input.value.trim()
    if (/^\d+$/.test(q)) navigate(`/film/${q}`)
    else showStatus('Введите числовой ID.', 'error')
  })

  await loadTop(1)
}

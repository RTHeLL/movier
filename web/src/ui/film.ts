import { ApigetError, fetchPlayerIframes } from '../api/apiget-player'
import { getFilmById, KpApiError, type FilmDetail } from '../api/kp-unofficial'
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

function pauseIframes(root: HTMLElement): void {
  root.querySelectorAll('iframe').forEach((iframe) => {
    try {
      iframe.contentWindow?.postMessage({ method: 'pause' }, '*')
    } catch {
      /* ignore */
    }
  })
}

function renderPlayerTabs(
  container: HTMLElement,
  urls: string[],
): void {
  container.innerHTML = ''
  if (urls.length === 0) return

  const wrap = el('div', 'player-tabs')
  const tabs = el('div', 'tab-links')

  urls.forEach((src, i) => {
    const panel = el('div', 'tab-panel')
    panel.hidden = i !== 0
    panel.setAttribute('data-tab-panel', String(i))

    const iframe = document.createElement('iframe')
    iframe.className = 'player-frame'
    iframe.src = src
    iframe.setAttribute('allowfullscreen', 'true')
    iframe.title = `Плеер ${i + 1}`
    panel.appendChild(iframe)
    wrap.appendChild(panel)

    const tab = el('button', 'tab-link' + (i === 0 ? ' active' : ''), `Плеер ${i + 1}`)
    tab.type = 'button'
    tab.addEventListener('click', () => {
      pauseIframes(wrap)
      wrap.querySelectorAll('.tab-panel').forEach((p, j) => {
        ;(p as HTMLElement).hidden = j !== i
      })
      tabs.querySelectorAll('.tab-link').forEach((b, j) => {
        b.classList.toggle('active', j === i)
      })
    })
    tabs.appendChild(tab)
  })

  if (urls.length > 1) {
    wrap.insertBefore(tabs, wrap.firstChild)
  }
  container.appendChild(wrap)
}

function formatLength(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m} мин`
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

export async function renderFilmPage(
  container: HTMLElement,
  filmId: number,
): Promise<void> {
  const back = el('button', 'btn btn-ghost back-link', '← К поиску')
  back.type = 'button'
  back.addEventListener('click', () => navigate('/'))

  const layout = el('div', 'film-layout')
  const aside = el('aside', 'film-aside')
  const main = el('main', 'film-main')

  const posterBox = el('div', 'film-poster-box')
  aside.appendChild(posterBox)

  const titleEl = el('h1', 'film-page-title', 'Загрузка…')
  const metaEl = el('p', 'film-page-meta', '')
  const descEl = el('div', 'film-description')

  const actions = el('div', 'film-actions')
  const kpLink = el('a', 'btn btn-ghost', 'Страница на Кинопоиске')
  kpLink.href = `https://www.kinopoisk.ru/film/${filmId}/`
  kpLink.target = '_blank'
  kpLink.rel = 'noopener noreferrer'

  const loadPlayersBtn = el('button', 'btn btn-primary', 'Загрузить плееры')
  loadPlayersBtn.type = 'button'

  actions.append(kpLink, loadPlayersBtn)

  const playerSection = el('section', 'player-section')
  const playerHeading = el('h2', 'section-title', 'Просмотр')
  const playerStatus = el('p', 'status-message')
  const playerMount = el('div', 'player-mount')

  playerSection.append(playerHeading, playerStatus, playerMount)

  main.append(titleEl, metaEl, descEl, actions, playerSection)
  layout.append(aside, main)

  container.append(back, layout)

  let film: FilmDetail | null = null

  const setPlayerMessage = (msg: string, kind: 'info' | 'error' | '') => {
    playerStatus.textContent = msg
    playerStatus.className = 'status-message' + (kind ? ` status-${kind}` : '')
  }

  try {
    film = await getFilmById(filmId)
  } catch (e) {
    if (e instanceof KpApiError) {
      titleEl.textContent = 'Ошибка'
      metaEl.textContent = e.message
      metaEl.classList.add('status-error')
    } else {
      titleEl.textContent = 'Ошибка'
      metaEl.textContent = 'Не удалось загрузить данные.'
    }
    loadPlayersBtn.disabled = true
    return
  }

  const displayTitle =
    film.nameRu || film.nameEn || film.nameOriginal || `Фильм ${film.kinopoiskId}`
  titleEl.textContent = displayTitle

  const metaParts = [
    film.year ? String(film.year) : '',
    film.type,
    film.ratingKinopoisk != null ? `КП: ${film.ratingKinopoisk}` : '',
    formatLength(film.filmLength),
  ].filter(Boolean)
  metaEl.textContent = metaParts.join(' · ')

  if (film.posterUrl || film.posterUrlPreview) {
    const img = document.createElement('img')
    img.className = 'film-poster'
    img.src = film.posterUrl || film.posterUrlPreview || ''
    img.alt = displayTitle
    posterBox.appendChild(img)
  } else {
    posterBox.textContent = 'Нет постера'
    posterBox.classList.add('film-poster-missing')
  }

  const text =
    film.description || film.shortDescription || 'Описание недоступно.'
  descEl.textContent = text

  if (film.webUrl) {
    kpLink.href = film.webUrl
  }

  setPlayerMessage('Нажмите «Загрузить плееры», чтобы запросить источники.', 'info')

  loadPlayersBtn.addEventListener('click', async () => {
    loadPlayersBtn.disabled = true
    setPlayerMessage('Загрузка плееров…', 'info')
    playerMount.innerHTML = ''

    try {
      const { error, all_player } = await fetchPlayerIframes(filmId)
      if (error !== 0 || all_player.length === 0) {
        setPlayerMessage(
          error !== 0
            ? `Источники недоступны (код ${error}). Попробуйте позже или откройте фильм на Кинопоиске с расширением.`
            : 'Список плееров пуст.',
          'error',
        )
        loadPlayersBtn.disabled = false
        return
      }
      setPlayerMessage('', '')
      renderPlayerTabs(playerMount, all_player)
    } catch (e) {
      if (e instanceof ApigetError) {
        setPlayerMessage(e.message, 'error')
      } else {
        setPlayerMessage('Ошибка при загрузке плееров.', 'error')
      }
      loadPlayersBtn.disabled = false
    }
  })
}

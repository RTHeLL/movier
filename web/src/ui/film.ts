import {
  ApiError,
  fetchPlayerIframes,
  getFilmById,
  withoutLastPlayer,
  type FilmDetail,
} from '../api/client'
import { el } from '../dom'
import {
  getOrCreateUid,
  getOrCreateUidKp,
  getOrCreateYandexLogin,
} from '../storage'
import { navigate } from '../router'

function pauseIframes(root: HTMLElement): void {
  root.querySelectorAll('iframe').forEach((iframe) => {
    try {
      iframe.contentWindow?.postMessage({ method: 'pause' }, '*')
    } catch {
      /* ignore */
    }
  })
}

function renderPlayerTabs(container: HTMLElement, urls: string[]): void {
  container.innerHTML = ''
  if (urls.length === 0) return

  const wrap = el('div', 'player-tabs')
  const tabs = el('div', 'tab-links')

  urls.forEach((src, i) => {
    const panel = el('div', 'tab-panel')
    panel.hidden = i !== 0

    const iframe = document.createElement('iframe')
    iframe.className = 'player-frame'
    iframe.src = src
    iframe.setAttribute('allowfullscreen', 'true')
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-presentation',
    )
    iframe.referrerPolicy = 'no-referrer'
    iframe.title = `Плеер ${i + 1}`
    panel.appendChild(iframe)
    wrap.appendChild(panel)

    const tab = el(
      'button',
      'tab-link' + (i === 0 ? ' active' : ''),
      `Плеер ${i + 1}`,
    )
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

  if (urls.length > 1) wrap.insertBefore(tabs, wrap.firstChild)
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
  const back = el('button', 'btn btn-ghost back-link', '← Назад')
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
  const kpLink = el('a', 'btn btn-ghost', 'Кинопоиск')
  kpLink.href = `https://www.kinopoisk.ru/film/${filmId}/`
  kpLink.target = '_blank'
  kpLink.rel = 'noopener noreferrer'
  const reloadBtn = el('button', 'btn btn-ghost', 'Обновить')
  reloadBtn.type = 'button'
  actions.append(kpLink, reloadBtn)

  const playerStatus = el('p', 'status-message')
  const playerMount = el('div', 'player-mount')
  const playerSection = el('section', 'player-section')
  playerSection.append(el('h2', 'section-title', 'Просмотр'), playerStatus, playerMount)

  main.append(titleEl, metaEl, descEl, actions, playerSection)
  layout.append(aside, main)
  container.append(back, layout)

  const setPlayerMessage = (msg: string, kind: 'info' | 'error' | '') => {
    playerStatus.textContent = msg
    playerStatus.className = 'status-message' + (kind ? ` status-${kind}` : '')
  }

  const loadPlayers = async () => {
    reloadBtn.disabled = true
    setPlayerMessage('Загрузка…', 'info')
    playerMount.innerHTML = ''
    try {
      const { error, all_player } = await fetchPlayerIframes(filmId, {
        uid: getOrCreateUid(),
        yandexLogin: getOrCreateYandexLogin(),
        uidKp: getOrCreateUidKp(),
      })
      const players = withoutLastPlayer(all_player)
      if (error !== 0 || players.length === 0) {
        setPlayerMessage(
          error !== 0 ? `Недоступно (код ${error}).` : 'Плееры не найдены.',
          'error',
        )
        return
      }
      setPlayerMessage('', '')
      renderPlayerTabs(playerMount, players)
    } catch (e) {
      setPlayerMessage(
        e instanceof ApiError ? e.message : 'Ошибка загрузки.',
        'error',
      )
    } finally {
      reloadBtn.disabled = false
    }
  }

  let film: FilmDetail
  try {
    film = await getFilmById(filmId)
  } catch (e) {
    titleEl.textContent = 'Ошибка'
    metaEl.textContent = e instanceof ApiError ? e.message : 'Не загружено.'
    metaEl.classList.add('status-error')
    reloadBtn.disabled = true
    return
  }

  const displayTitle =
    film.nameRu || film.nameEn || film.nameOriginal || `Фильм ${film.kinopoiskId}`
  titleEl.textContent = displayTitle
  metaEl.textContent = [
    film.year ? String(film.year) : '',
    film.type,
    film.ratingKinopoisk != null ? `КП: ${film.ratingKinopoisk}` : '',
    formatLength(film.filmLength),
  ]
    .filter(Boolean)
    .join(' · ')

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

  descEl.textContent =
    film.description || film.shortDescription || 'Нет описания.'
  if (film.webUrl) kpLink.href = film.webUrl

  reloadBtn.addEventListener('click', () => void loadPlayers())
  await loadPlayers()
}

import { navigate } from '../router'
import type { SearchFilmItem } from '../api/client'
import { el } from '../dom'

export function renderFilmCards(
  container: HTMLElement,
  films: SearchFilmItem[],
): void {
  for (const f of films) {
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
    const name = f.nameRu || f.nameEn || `Фильм #${f.filmId}`
    body.append(
      el('h2', 'film-card-title', name),
      el(
        'p',
        'film-card-meta',
        [f.year, f.type, f.rating ? `★ ${f.rating}` : '']
          .filter(Boolean)
          .join(' · '),
      ),
    )
    card.append(poster, body)

    const go = () => navigate(`/film/${f.filmId}`)
    card.addEventListener('click', go)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        go()
      }
    })

    container.appendChild(card)
  }
}

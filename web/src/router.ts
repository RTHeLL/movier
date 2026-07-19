import { renderFilmPage } from './ui/film'
import { renderHomePage } from './ui/home'
import { renderInstallPage } from './ui/install'

type Route =
  | { name: 'home' }
  | { name: 'film'; id: number }
  | { name: 'install' }

function parseRoute(): Route {
  const raw = window.location.hash.replace(/^#/, '').trim() || '/'
  if (raw === '/install' || raw === 'install') return { name: 'install' }
  const filmMatch = /^\/film\/(\d+)\/?$/.exec(raw)
  if (filmMatch) {
    const id = parseInt(filmMatch[1], 10)
    if (id > 0) return { name: 'film', id }
  }
  return { name: 'home' }
}

export function navigate(path: string): void {
  window.location.hash = path.startsWith('#') ? path.slice(1) : path
}

export function initRouter(): void {
  const app = document.querySelector<HTMLElement>('#app')
  if (!app) return

  const render = (): void => {
    app.innerHTML = ''
    const route = parseRoute()
    if (route.name === 'film') {
      void renderFilmPage(app, route.id)
    } else if (route.name === 'install') {
      void renderInstallPage(app)
    } else {
      void renderHomePage(app)
    }
  }

  window.addEventListener('hashchange', render)
  render()
}

import { navigate } from '../router'
import { el } from '../dom'

/** Заметный блок установки расширения на главной. */
export function renderInstallBanner(parent: HTMLElement): void {
  const banner = el('aside', 'install-banner')
  banner.setAttribute('aria-label', 'Установка расширения')

  const text = el('div', 'install-banner-text')
  text.append(
    el('strong', 'install-banner-title', 'Расширение Movier'),
    el(
      'span',
      'install-banner-desc',
      'Плееры на Кинопоиске — установка вручную из пакета на GitHub.',
    ),
  )

  const actions = el('div', 'install-banner-actions')
  const open = el('button', 'btn btn-primary', 'Как установить')
  open.type = 'button'
  open.addEventListener('click', () => navigate('/install'))

  const zip = document.createElement('a')
  zip.className = 'btn btn-ghost'
  zip.href = `${import.meta.env.BASE_URL}extension/movier-extension.zip`
  zip.textContent = 'Скачать ZIP'
  zip.setAttribute('download', 'movier-extension.zip')
  zip.rel = 'noopener'

  actions.append(open, zip)
  banner.append(text, actions)
  parent.appendChild(banner)
}

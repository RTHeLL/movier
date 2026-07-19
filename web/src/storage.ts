const LS_UID = 'movier_apiget_uid'
const LS_YANDEX = 'movier_fake_yandex_login'
const LS_UID_KP = 'movier_UID_KP'

function randomFromChars(length: number, chars: string): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function getOrCreateUid(): string {
  let v = localStorage.getItem(LS_UID)
  if (!v) {
    v = randomFromChars(16, 'abcdefghijklmnopqrstuvwxyz0123456789')
    localStorage.setItem(LS_UID, v)
  }
  return v
}

export function getOrCreateYandexLogin(): string {
  let v = localStorage.getItem(LS_YANDEX)
  if (!v) {
    v = randomFromChars(12, 'abcdefghijklmnopqrstuvwxyz0123456789')
    localStorage.setItem(LS_YANDEX, v)
  }
  return v
}

export function getOrCreateUidKp(): string {
  let v = localStorage.getItem(LS_UID_KP)
  if (!v) {
    v = randomFromChars(
      32,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    )
    localStorage.setItem(LS_UID_KP, v)
  }
  return v
}

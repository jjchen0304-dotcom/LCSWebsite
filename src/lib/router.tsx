import { type ReactNode } from 'react'

export const HOME_PATH = '/'
export const REGISTRATION_PATH = '/registration'
export const CALENDAR_PATH = '/calendar'
export const NEWS_PATH = '/news'
export const ADMIN_PATH = '/admin'
export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_REGISTRATIONS_PATH = '/admin/registrations'
export const ADMIN_ANNOUNCEMENTS_PATH = '/admin/announcements'
export const ADMIN_ANNOUNCEMENTS_NEW_PATH = '/admin/announcements/new'
export const ADMIN_NEWS_PATH = '/admin/news'
export const ADMIN_NEWS_NEW_PATH = '/admin/news/new'
export const ADMIN_CALENDAR_PATH = '/admin/calendar'
export const ADMIN_CALENDAR_NEW_PATH = '/admin/calendar/new'

export type AppPath =
  | '/'
  | '/registration'
  | '/calendar'
  | '/news'
  | `/news/${string}`
  | '/admin'
  | '/admin/login'
  | '/admin/registrations'
  | '/admin/announcements'
  | '/admin/announcements/new'
  | '/admin/news'
  | '/admin/news/new'
  | '/admin/calendar'
  | '/admin/calendar/new'

export function getCurrentPath(): AppPath {
  if (typeof window === 'undefined') return HOME_PATH

  if (window.location.pathname === REGISTRATION_PATH) return REGISTRATION_PATH
  if (window.location.pathname === CALENDAR_PATH) return CALENDAR_PATH
  if (window.location.pathname === NEWS_PATH) return NEWS_PATH
  if (window.location.pathname.startsWith(`${NEWS_PATH}/`)) return window.location.pathname as AppPath
  if (window.location.pathname === ADMIN_LOGIN_PATH) return ADMIN_LOGIN_PATH
  if (window.location.pathname === ADMIN_REGISTRATIONS_PATH) return ADMIN_REGISTRATIONS_PATH
  if (window.location.pathname === ADMIN_ANNOUNCEMENTS_NEW_PATH) return ADMIN_ANNOUNCEMENTS_NEW_PATH
  if (window.location.pathname === ADMIN_ANNOUNCEMENTS_PATH) return ADMIN_ANNOUNCEMENTS_PATH
  if (window.location.pathname === ADMIN_NEWS_NEW_PATH) return ADMIN_NEWS_NEW_PATH
  if (window.location.pathname === ADMIN_NEWS_PATH) return ADMIN_NEWS_PATH
  if (window.location.pathname === ADMIN_CALENDAR_NEW_PATH) return ADMIN_CALENDAR_NEW_PATH
  if (window.location.pathname === ADMIN_CALENDAR_PATH) return ADMIN_CALENDAR_PATH
  if (window.location.pathname === ADMIN_PATH) return ADMIN_PATH

  return HOME_PATH
}

export function getNewsPostId(path: string) {
  if (!path.startsWith(`${NEWS_PATH}/`)) return null

  const rawId = path.slice(NEWS_PATH.length + 1)
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) return null

  return id
}

export function navigateTo(href: string) {
  if (typeof window === 'undefined') return

  const url = new URL(href, window.location.origin)
  const next = `${url.pathname}${url.hash}`
  const current = `${window.location.pathname}${window.location.hash}`

  if (next === current) return

  window.history.pushState({}, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))

  if (url.hash) {
    requestAnimationFrame(() => {
      const target = document.getElementById(url.hash.slice(1))
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function SmartLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  const isInternal = href.startsWith('/') || href.startsWith('#')

  if (!isInternal) {
    return <a className={className} href={href}>{children}</a>
  }

  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        event.preventDefault()
        navigateTo(href.startsWith('#') ? `${HOME_PATH}${href}` : href)
      }}
    >
      {children}
    </a>
  )
}

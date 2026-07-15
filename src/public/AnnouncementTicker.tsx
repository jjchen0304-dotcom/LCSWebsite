import { ChevronRight, Megaphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SmartLink } from '../lib/router'
import type { AnnouncementRow } from '../lib/supabase'

function formatAnnouncementDate(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AnnouncementTicker({
  announcements,
  loading,
  error,
}: {
  announcements: AnnouncementRow[]
  loading: boolean
  error: string | null
}) {
  const [paused, setPaused] = useState(false)
  const hasAnnouncements = announcements.length > 0
  const shouldAnimate = announcements.length > 1

  const items = useMemo(
    () => (shouldAnimate ? [...announcements, ...announcements] : announcements),
    [announcements, shouldAnimate],
  )

  if (!loading && !error && !hasAnnouncements) {
    return null
  }

  return (
    <section className="announcement-ribbon">
      <div className="container">
        <div className="announcement-ribbon-inner">
          <div className="announcement-ribbon-label">
            <Megaphone size={18} />
            <strong>Announcements</strong>
          </div>

          {loading ? (
            <p className="announcement-ribbon-status">Loading announcements…</p>
          ) : null}

          {error ? (
            <p className="announcement-ribbon-status announcement-ribbon-error">
              Announcements are temporarily unavailable.
            </p>
          ) : null}

          {!loading && !error && hasAnnouncements ? (
            <div
              className={`announcement-marquee ${shouldAnimate ? '' : 'is-static'} ${paused ? 'is-paused' : ''}`}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onPointerDown={() => setPaused(true)}
              onPointerUp={() => setPaused(false)}
              onTouchStart={() => setPaused(true)}
              onTouchEnd={() => setPaused(false)}
            >
              <div className="announcement-marquee-track">
                {items.map((announcement, index) => {
                  const dateLabel = formatAnnouncementDate(announcement.starts_at || announcement.created_at)
                  const isDuplicate = shouldAnimate && index >= announcements.length

                  return (
                    <article
                      className="announcement-chip"
                      key={`${announcement.id}-${index}`}
                      aria-hidden={isDuplicate ? 'true' : undefined}
                    >
                      <div className="announcement-chip-header">
                        <h3>{announcement.title}</h3>
                        {dateLabel ? <small>{dateLabel}</small> : null}
                      </div>
                      <p>{announcement.message}</p>
                      {announcement.link ? (
                        <SmartLink className="announcement-chip-link" href={announcement.link}>
                          Learn More <ChevronRight size={14} />
                        </SmartLink>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

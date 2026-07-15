import { BellRing, CalendarDays, ClipboardList, Newspaper } from 'lucide-react'
import {
  ADMIN_ANNOUNCEMENTS_PATH,
  ADMIN_CALENDAR_PATH,
  ADMIN_NEWS_PATH,
  ADMIN_REGISTRATIONS_PATH,
  SmartLink,
} from '../lib/router'

export default function AdminHomePage() {
  return (
    <section className="registration section">
      <div className="container admin-shell">
        <div className="admin-header-row">
          <div>
            <h2>Home</h2>
            <p className="admin-copy">Choose the area you want to manage.</p>
          </div>
        </div>
        <div className="admin-home-grid">
          <SmartLink className="admin-home-card" href={ADMIN_REGISTRATIONS_PATH}>
            <ClipboardList size={26} />
            <strong>Registrations</strong>
            <span>Review submitted registrations, update status and notes, and export filtered CSV files.</span>
          </SmartLink>
          <SmartLink className="admin-home-card" href={ADMIN_ANNOUNCEMENTS_PATH}>
            <BellRing size={26} />
            <strong>Announcements</strong>
            <span>Publish short homepage notices, control priority, and archive old reminders.</span>
          </SmartLink>
          <SmartLink className="admin-home-card" href={ADMIN_NEWS_PATH}>
            <Newspaper size={26} />
            <strong>News</strong>
            <span>Create articles for the homepage and public news pages without changing the site layout.</span>
          </SmartLink>
          <SmartLink className="admin-home-card" href={ADMIN_CALENDAR_PATH}>
            <CalendarDays size={26} />
            <strong>Calendar</strong>
            <span>Create, edit, publish, unpublish, and delete events shown on the public calendar.</span>
          </SmartLink>
        </div>
      </div>
    </section>
  )
}

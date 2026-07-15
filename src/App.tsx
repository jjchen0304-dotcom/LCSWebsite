import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  Clock,
  CreditCard,
  LoaderCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import AdminAnnouncementsPage from './admin/AdminAnnouncementsPage'
import AdminCalendarPage from './admin/AdminCalendarPage'
import AdminHomePage from './admin/AdminHomePage'
import AdminLoginPage from './admin/AdminLoginPage'
import AdminNewsPage from './admin/AdminNewsPage'
import AdminRegistrationsPage from './admin/AdminRegistrationsPage'
import { AdminRoute, useAdminSession } from './admin/AdminRoute'
import Footer from './components/Footer'
import Header from './components/Header'
import { siteData } from './data/siteData'
import {
  fetchPublicAnnouncements,
  fetchPublicCalendarEvents,
  fetchPublicNewsPosts,
  submitRegistration,
  type AnnouncementRow,
  type CalendarEventRow,
  type NewsPostRow,
} from './lib/supabase'
import {
  ADMIN_ANNOUNCEMENTS_PATH,
  ADMIN_ANNOUNCEMENTS_NEW_PATH,
  ADMIN_CALENDAR_PATH,
  ADMIN_CALENDAR_NEW_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_NEWS_PATH,
  ADMIN_NEWS_NEW_PATH,
  ADMIN_PATH,
  ADMIN_REGISTRATIONS_PATH,
  CALENDAR_PATH,
  getCurrentPath,
  getNewsPostId,
  HOME_PATH,
  navigateTo,
  NEWS_PATH,
  REGISTRATION_PATH,
  SmartLink,
  type AppPath,
} from './lib/router'
import AnnouncementTicker from './public/AnnouncementTicker'
import NewsDetailPage from './public/NewsDetailPage'
import NewsPage from './public/NewsPage'
import NewsPreview from './public/NewsPreview'

const baseTuition = 150
const earlyBirdDiscount = 5
const earlyBirdDeadline = new Date('2026-01-11T23:59:59')
const isEarlyBirdAvailable = new Date() <= earlyBirdDeadline
const homeCalendarFallback = [
  {
    id: 'preview-calendar-1',
    category: 'School Day',
    title: 'Opening Sunday and family welcome',
    dateLabel: 'Sep 13, 2026, 2:00 PM',
    location: 'Patterson Hall',
    description: 'First day arrival, classroom introductions, and semester kickoff for students and families.',
  },
  {
    id: 'preview-calendar-2',
    category: 'Community',
    title: 'Mid-autumn cultural afternoon',
    dateLabel: 'Oct 4, 2026, 2:00 PM',
    location: 'Patterson Hall',
    description: 'A schoolwide afternoon with stories, songs, and seasonal cultural activities woven into the class schedule.',
  },
  {
    id: 'preview-calendar-3',
    category: 'Volunteer',
    title: 'Parent support and event planning meeting',
    dateLabel: 'Oct 25, 2026, 1:30 PM',
    location: 'School lobby',
    description: 'Volunteer planning for classroom support, school events, and family community coordination.',
  },
] as const

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function groupCalendarEvents(events: CalendarEventRow[]) {
  const groups = new Map<string, CalendarEventRow[]>()

  for (const event of events) {
    const key = event.start_at.slice(0, 7)
    const entries = groups.get(key) ?? []
    entries.push(event)
    groups.set(key, entries)
  }

  return Array.from(groups.entries()).map(([key, entries]) => ({
    key,
    label: monthLabel(`${key}-01T00:00:00`),
    entries,
  }))
}

function HomePage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [newsPosts, setNewsPosts] = useState<NewsPostRow[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventRow[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [calendarError, setCalendarError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setAnnouncementsLoading(true)
      setAnnouncementsError(null)

      try {
        const rows = await fetchPublicAnnouncements()
        if (!cancelled) setAnnouncements(rows)
      } catch (loadError) {
        console.error('Failed to load announcements', loadError)
        if (!cancelled) {
          setAnnouncements([])
          setAnnouncementsError(loadError instanceof Error ? loadError.message : 'Unable to load announcements.')
        }
      } finally {
        if (!cancelled) setAnnouncementsLoading(false)
      }
    })()

    void (async () => {
      setNewsLoading(true)
      setNewsError(null)

      try {
        const rows = await fetchPublicNewsPosts(4)
        if (!cancelled) setNewsPosts(rows)
      } catch (loadError) {
        console.error('Failed to load news posts', loadError)
        if (!cancelled) {
          setNewsPosts([])
          setNewsError(loadError instanceof Error ? loadError.message : 'Unable to load news.')
        }
      } finally {
        if (!cancelled) setNewsLoading(false)
      }
    })()

    void (async () => {
      setCalendarLoading(true)
      setCalendarError(null)

      try {
        const rows = await fetchPublicCalendarEvents()
        if (!cancelled) setCalendarEvents(rows)
      } catch (loadError) {
        console.error('Failed to load calendar events', loadError)
        if (!cancelled) {
          setCalendarEvents([])
          setCalendarError(loadError instanceof Error ? loadError.message : 'Unable to load calendar.')
        }
      } finally {
        if (!cancelled) setCalendarLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const upcomingEvents = calendarEvents
    .filter((event) => new Date(event.start_at).getTime() >= Date.now())
    .slice(0, 3)

  const previewEvents = upcomingEvents.length > 0 ? upcomingEvents : calendarEvents.slice(0, 3)

  return (
    <>
      <section className="hero">
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <img className="mountain" src="/zhangjiajie-transparent-final.png" alt="" />
        </div>
        <div className="container hero-content">
          <div>
            <p className="eyebrow">Welcome</p>
            <h1>Language, culture, and community.</h1>
            <p className="lead">Explore programs, learn about school life, and find a place for families to grow through Chinese language and heritage.</p>
            <div className="hero-actions">
              <SmartLink className="button primary" href={REGISTRATION_PATH}>Visit registration <ArrowRight size={18} /></SmartLink>
              <SmartLink className="button secondary" href="/#programs">Explore Programs</SmartLink>
            </div>
          </div>
        </div>
      </section>
      <AnnouncementTicker announcements={announcements} loading={announcementsLoading} error={announcementsError} />
      <section id="about" className="about section">
        <div className="container split">
          <div className="photo-panel"><div className="character">文</div><span>Community photo placeholder</span></div>
          <div>
            <p className="eyebrow gold">About our school</p>
            <h2>Rooted in Lexington since {siteData.school.founded}</h2>
            <p>Lexington Chinese School is a nonprofit organization committed to serving the Lexington community through the study of Chinese language, culture, and heritage.</p>
            <p>Its classes have been designed for both Chinese-speaking and non-Chinese-speaking families, creating a place where students can strengthen communication skills while building meaningful cultural connections.</p>
            <div className="facts">
              <div><strong>1995</strong><span>Established</span></div>
              <div><strong>All ages</strong><span>Pre-K through adult</span></div>
              <div><strong>4 skills</strong><span>Listen, speak, read, write</span></div>
            </div>
            <SmartLink className="text-link" href="/#programs">Learn more about LCS <ArrowRight size={17} /></SmartLink>
          </div>
        </div>
      </section>
      <section id="registration-home" className="shortcuts section">
        <div className="container">
          <div className="section-heading centered">
            <p className="eyebrow red">Popular shortcuts</p>
            <h2>Find what your family needs</h2>
          </div>
          <div className="shortcut-grid">
            {siteData.shortcuts.map(({ label, detail, icon: Icon, href }) => (
              <SmartLink className="shortcut" key={label} href={href}>
                <span className="icon"><Icon /></span>
                <span><strong>{label}</strong><small>{detail}</small></span>
                <ChevronRight />
              </SmartLink>
            ))}
          </div>
        </div>
      </section>
      <NewsPreview posts={newsPosts} loading={newsLoading} error={newsError} />
      <section id="programs" className="programs section">
        <div className="container">
          <div className="section-heading centered">
            <p className="eyebrow gold">Learning at LCS</p>
            <h2>Programs for every stage</h2>
            <p>Class placement and offerings should be confirmed for the upcoming academic year.</p>
          </div>
          <div className="program-grid">
            {siteData.programs.map(({ title, subtitle, description, icon: Icon }) => (
              <article className="program-card" key={title}>
                <Icon />
                <p className="chinese">{subtitle}</p>
                <h3>{title}</h3>
                <p>{description}</p>
                <SmartLink href={siteData.school.registrationUrl}>View registration <ArrowRight size={16} /></SmartLink>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="calendar" className="events section home-calendar-section">
        <div className="container">
          <div className="section-heading centered">
            <div>
              <p className="eyebrow red">Calendar</p>
              <h2>Upcoming school events</h2>
            </div>
            <SmartLink className="text-link section-heading-link" href={CALENDAR_PATH}>View full calendar <ArrowRight size={17} /></SmartLink>
          </div>
          {calendarLoading ? <p className="loading-note">Loading calendar…</p> : null}
          {!calendarLoading && !calendarError ? (
            <div className="home-calendar-grid">
              {previewEvents.length > 0 ? previewEvents.map((event) => (
                <article className="calendar-preview-card" key={event.id}>
                  <p className="tag">{event.category || 'Event'}</p>
                  <h3>{event.title}</h3>
                  <p className="calendar-preview-date">{formatDateTime(event.start_at)}</p>
                  {event.location ? <p>{event.location}</p> : null}
                  {event.description ? <p>{event.description}</p> : null}
                </article>
              )) : null}
            </div>
          ) : null}
          {!calendarLoading && (calendarError || previewEvents.length === 0) ? (
            <>
              <p className="preview-note">Preview events are shown here until published calendar entries are connected.</p>
              <div className="home-calendar-grid">
                {homeCalendarFallback.map((event) => (
                  <article className="calendar-preview-card" key={event.id}>
                    <p className="tag">{event.category}</p>
                    <h3>{event.title}</h3>
                    <p className="calendar-preview-date">{event.dateLabel}</p>
                    <p>{event.location}</p>
                    <p>{event.description}</p>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
      <section id="community" className="community">
        <div className="container">
          <p className="eyebrow gold">Our community</p>
          <h2>Help language and heritage thrive.</h2>
          <p>Families, teachers, volunteers, and community partners make Lexington Chinese School possible.</p>
          <div>
            <SmartLink className="button light" href="/#contact">Volunteer with LCS</SmartLink>
            <SmartLink className="button outline-light" href="/#contact">Support the school</SmartLink>
          </div>
        </div>
      </section>
    </>
  )
}

function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const rows = await fetchPublicCalendarEvents()
        if (!cancelled) setEvents(rows)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load calendar events.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const groups = groupCalendarEvents(events)

  return (
    <>
      <section className="subhero calendar-hero">
        <div className="container subhero-inner">
          <div>
            <p className="eyebrow red">Calendar</p>
            <h1>Spring 2026 calendar</h1>
          </div>
          <SmartLink className="text-link back-link" href={HOME_PATH}><ArrowRight size={17} /> Back home</SmartLink>
        </div>
      </section>
      <section className="events section">
        <div className="container">
          <div className="section-heading row">
            <div>
              <p className="eyebrow red">Key dates</p>
              <h2>School days, breaks, and community events</h2>
              <p>Sunday classes meet from 2:00 to 4:00 p.m. at Patterson Hall unless a special event note says otherwise.</p>
            </div>
          </div>
          {loading ? <p className="loading-note"><LoaderCircle size={18} /> Loading calendar events…</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!loading && !error ? (
            <div className="calendar-grid">
              {groups.map((group) => (
                <article className="calendar-card" key={group.key}>
                  <h3>{group.label}</h3>
                  <ul className="calendar-list">
                    {group.entries.map((event) => (
                      <li key={event.id}>
                        <strong>{formatDateTime(event.start_at)}</strong>
                        <span>{event.title}</span>
                        {event.location ? <span>{event.location}</span> : null}
                        {event.description ? <span>{event.description}</span> : null}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}

function RegistrationPage({
  earlyBird,
  paymentMethod,
  submittedMessage,
  submitError,
  submitting,
  tuitionTotal,
  onToggleEarlyBird,
  onPaymentMethodChange,
  onSubmit,
}: {
  earlyBird: boolean
  paymentMethod: string
  submittedMessage: string | null
  submitError: string | null
  submitting: boolean
  tuitionTotal: number
  onToggleEarlyBird: (value: boolean) => void
  onPaymentMethodChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  const evaluateForm = () => {
    const form = formRef.current
    if (!form) return

    const formData = new FormData(form)
    const invalid: string[] = []

    const requiredFields = [
      'parentName',
      'email',
      'phone',
      'address',
      'studentName',
      'age',
      'grade',
      'program',
      'classPreference',
    ] as const

    for (const field of requiredFields) {
      const value = String(formData.get(field) || '').trim()
      if (value.length === 0) invalid.push(field)
    }

    if (!String(formData.get('paymentMethod') || '').trim()) invalid.push('paymentMethod')
    if (!formData.get('termsAccepted')) invalid.push('termsAccepted')

    setInvalidFields(invalid)
    setFormReady(invalid.length === 0)
  }

  useEffect(() => {
    evaluateForm()
  }, [earlyBird, paymentMethod])

  const actionContent = (
    <>
      <button
        className="button primary"
        type="submit"
        disabled={!formReady || submitting}
        title={formReady ? undefined : 'Complete all required fields to enable submission'}
      >
        {submitting ? <><LoaderCircle size={18} /> Submitting…</> : <>Submit registration request <ArrowRight size={18} /></>}
      </button>
      {submittedMessage ? <p className="form-success"><CheckCircle2 size={18} />{submittedMessage}</p> : null}
      {submitError ? <p className="form-error">{submitError}</p> : null}
    </>
  )

  return (
    <>
      <section className="subhero registration-hero">
        <div className="container subhero-inner">
          <div><h1>Registration</h1></div>
          <div className="registration-badge"><ShieldCheck size={18} /> Spring 2026 enrollment</div>
          <SmartLink className="text-link back-link" href={HOME_PATH}><ArrowRight size={17} /> Back home</SmartLink>
        </div>
      </section>
      <section id="registration" className="registration section">
        <div className="container">
          <div className="section-heading row">
            <div><p className="eyebrow red">Registration form</p><h2>Student registration</h2><p>Complete the form below to share family details, program preferences, and enrollment information.</p></div>
          </div>
          <div className="registration-layout">
            <form className="registration-form" id="registration-form" ref={formRef} onInput={evaluateForm} onChange={evaluateForm} onSubmit={onSubmit}>
              <div className="form-card">
                <h3>Parent or guardian</h3>
                <div className="field-grid">
                  <label className={invalidFields.includes('parentName') ? 'field-error' : ''}><span>Parent name</span><input name="parentName" placeholder="First and last name" required /></label>
                  <label className={invalidFields.includes('email') ? 'field-error' : ''}><span>Your email</span><input type="email" name="email" placeholder="family@example.com" required /></label>
                  <label className={invalidFields.includes('phone') ? 'field-error' : ''}><span>Phone number</span><input type="tel" name="phone" placeholder="(859) 555-0123" required /></label>
                  <label className={invalidFields.includes('address') ? 'field-error' : ''}><span>Address</span><input name="address" placeholder="Street, city, state, ZIP" required /></label>
                </div>
              </div>
              <div className="form-card">
                <h3>Student information</h3>
                <div className="field-grid">
                  <label className={invalidFields.includes('studentName') ? 'field-error' : ''}><span>Student name</span><input name="studentName" placeholder="Student full name" required /></label>
                  <label><span>Chinese name</span><input name="chineseName" placeholder="Optional" /></label>
                  <label className={invalidFields.includes('age') ? 'field-error' : ''}><span>Age</span><input type="number" name="age" min="3" max="99" placeholder="10" required /></label>
                  <label className={invalidFields.includes('grade') ? 'field-error' : ''}><span>Grade level</span><select name="grade" defaultValue="" required><option value="" disabled>Select grade</option><option>Pre-K</option><option>Kindergarten</option><option>1st grade</option><option>2nd grade</option><option>3rd grade</option><option>4th grade</option><option>5th grade</option><option>Middle school</option><option>High school</option><option>Adult learner</option></select></label>
                  <label className={invalidFields.includes('program') ? 'field-error' : ''}><span>Program</span><select name="program" defaultValue="Chinese Language" required><option>Chinese Language</option><option>Chinese as a Second Language</option><option>Culture & Heritage</option><option>Arts & Enrichment</option></select></label>
                  <label className={invalidFields.includes('classPreference') ? 'field-error' : ''}><span>Class preference</span><select name="classPreference" defaultValue="Sunday in-person" required><option>Sunday in-person</option><option>Beginner placement needed</option><option>Returning student placement</option></select></label>
                </div>
                <label className="full-width"><span>Notes for placement or allergies (optional)</span><textarea name="notes" rows={4} placeholder="Anything teachers should know before the first class" /></label>
              </div>
              <div className="form-card">
                <h3>Payment method</h3>
                <div className="choice-grid">
                  <label className={`choice-card ${paymentMethod === 'zelle' ? 'active' : ''} ${invalidFields.includes('paymentMethod') ? 'field-error' : ''}`}><input type="radio" name="paymentMethod" value="zelle" checked={paymentMethod === 'zelle'} onChange={(event) => onPaymentMethodChange(event.target.value)} /><div><strong>Pay with Zelle</strong><p>Send payment to {siteData.school.registrationEmail}. Include the student name in the memo field.</p></div></label>
                  <label className={`choice-card ${paymentMethod === 'check' ? 'active' : ''} ${invalidFields.includes('paymentMethod') ? 'field-error' : ''}`}><input type="radio" name="paymentMethod" value="check" checked={paymentMethod === 'check'} onChange={(event) => onPaymentMethodChange(event.target.value)} /><div><strong>Mail a personal check</strong><p>Make the check payable to Lexington Chinese School and mail it to the school mailing address used for registration.</p></div></label>
                </div>
                <label className={`toggle-row ${!isEarlyBirdAvailable ? 'disabled' : ''}`}><input type="checkbox" checked={earlyBird && isEarlyBirdAvailable} disabled={!isEarlyBirdAvailable} onChange={(event) => onToggleEarlyBird(event.target.checked)} /><span>{isEarlyBirdAvailable ? 'Apply the early-bird discount for registrations completed by January 11, 2026.' : 'Early-bird pricing deadline has passed for Spring 2026.'}</span></label>
              </div>
              <div className="form-card">
                <h3>Terms and conditions</h3>
                <div className="consent-list">
                  <label className={invalidFields.includes('termsAccepted') ? 'field-error' : ''}><input type="checkbox" name="termsAccepted" required /><span>I have read and agree to the <button className="inline-link" type="button" onClick={() => setShowTerms(true)}>terms and conditions</button> for Spring 2026, including payment terms, photo policy, medical authorization, and participation waiver.</span></label>
                </div>
              </div>
              <div className="form-actions">{actionContent}</div>
            </form>
            <aside className="registration-sidebar">
              <div className="summary-card">
                <div className="summary-heading"><CreditCard size={20} /><h3>Tuition summary</h3></div>
                <div className="summary-row"><span>Base tuition</span><strong>${baseTuition.toFixed(2)}</strong></div>
                <div className="summary-row"><span>Early-bird discount</span><strong>{earlyBird && isEarlyBirdAvailable ? '-$5.00' : '$0.00'}</strong></div>
                <div className="summary-row total"><span>Total tuition</span><strong>${tuitionTotal.toFixed(2)}</strong></div>
                <p>{isEarlyBirdAvailable ? 'Spring 2026 early-bird pricing ends on January 11, 2026.' : 'Early-bird pricing deadline passed on January 11, 2026.'}</p>
              </div>
              <div className="mobile-submit">{actionContent}</div>
              <div className="summary-card">
                <div className="summary-heading"><CalendarDays size={20} /><h3>Important notes</h3></div>
                <ul className="summary-list">
                  <li>In-person classes meet every Sunday from 2:00 to 4:00 p.m.</li>
                  <li>Location: Patterson Hall of UK, 120 Campus Drive, Lexington, Kentucky 40508.</li>
                  <li>Weekend parking is available in most employee and student commuter lots.</li>
                  <li>Parents should walk students to the classroom and should not drop them in the campus driveway.</li>
                  <li>If registering on a phone, use the default browser instead of opening the form inside WeChat.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
      {showTerms ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-title">
          <div className="terms-modal">
            <div className="terms-modal-header">
              <h3 id="terms-title">Spring 2026 terms and conditions</h3>
              <button className="terms-close" type="button" onClick={() => setShowTerms(false)}>Close</button>
            </div>
            <div className="terms-modal-body">
              <p>By submitting registration, families agree to the following:</p>
              <ul className="terms-list">
                <li>Tuition is due in full by the second Saturday of classes, and a $20 late fee may apply after four weeks.</li>
                <li>Refunds are limited and generally unavailable after the sixth week of classes.</li>
                <li>Parents authorize LCS officers or teachers to obtain medical treatment during school activities if needed, and related medical costs remain the family’s responsibility.</li>
                <li>Families release and hold harmless Lexington Chinese School, its officers, teachers, representatives, and parents on duty for injuries or accidents related to participation in school sessions and activities.</li>
                <li>LCS may display student photos, projects, first names, and grade levels in school publications or promotional materials unless a different written policy is provided by school leadership.</li>
                <li>Parents should walk students to the classroom and should not drop them off in the campus driveway.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function AdminSubhero({
  activeSection,
  onLogout,
}: {
  activeSection: 'home' | 'announcements' | 'news' | 'registrations' | 'calendar'
  onLogout: () => void | Promise<void>
}) {
  return (
    <section className="subhero admin-subhero">
      <div className="container subhero-inner">
        <div><p className="eyebrow red">Admin</p><h1>Dashboard</h1></div>
        <div className="hero-actions">
          <SmartLink className={`button secondary admin-secondary admin-tab${activeSection === 'home' ? ' admin-tab-active' : ''}`} href={ADMIN_PATH}>Home</SmartLink>
          <SmartLink className={`button secondary admin-secondary admin-tab${activeSection === 'announcements' ? ' admin-tab-active' : ''}`} href={ADMIN_ANNOUNCEMENTS_PATH}>Announcements</SmartLink>
          <SmartLink className={`button secondary admin-secondary admin-tab${activeSection === 'news' ? ' admin-tab-active' : ''}`} href={ADMIN_NEWS_PATH}>News</SmartLink>
          <SmartLink className={`button secondary admin-secondary admin-tab${activeSection === 'registrations' ? ' admin-tab-active' : ''}`} href={ADMIN_REGISTRATIONS_PATH}>Registrations</SmartLink>
          <SmartLink className={`button secondary admin-secondary admin-tab${activeSection === 'calendar' ? ' admin-tab-active' : ''}`} href={ADMIN_CALENDAR_PATH}>Calendar</SmartLink>
          <button className="button primary" type="button" onClick={() => void onLogout()}><LogOut size={18} /> Log out</button>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [path, setPath] = useState<AppPath>(getCurrentPath)
  const [earlyBird, setEarlyBird] = useState(isEarlyBirdAvailable)
  const [paymentMethod, setPaymentMethod] = useState('zelle')
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const tuitionTotal = baseTuition - (earlyBird && isEarlyBirdAvailable ? earlyBirdDiscount : 0)
  const admin = useAdminSession()
  const newsPostId = getNewsPostId(path)

  useEffect(() => {
    const handlePopstate = () => setPath(getCurrentPath())
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])

  useEffect(() => {
    if (path === ADMIN_LOGIN_PATH && admin.isVerified) {
      navigateTo(ADMIN_PATH)
    }
  }, [admin.isVerified, path])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmittedMessage(null)
    setSubmitError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await submitRegistration({
        parentName: String(formData.get('parentName') || ''),
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        address: String(formData.get('address') || ''),
        studentName: String(formData.get('studentName') || ''),
        chineseName: String(formData.get('chineseName') || ''),
        age: Number(formData.get('age') || 0),
        grade: String(formData.get('grade') || ''),
        program: String(formData.get('program') || ''),
        classPreference: String(formData.get('classPreference') || ''),
        notes: String(formData.get('notes') || ''),
        paymentMethod: String(formData.get('paymentMethod') || 'zelle') as 'zelle' | 'check',
        earlyBird: earlyBird && isEarlyBirdAvailable,
      })

      event.currentTarget.reset()
      setPaymentMethod('zelle')
      setEarlyBird(isEarlyBirdAvailable)
      setSubmittedMessage(result ? `Submitted successfully. Confirmation number: ${result.registration_number}.` : 'Submitted successfully.')
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : 'Unable to submit registration.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      await admin.login(String(formData.get('email') || ''), String(formData.get('password') || ''))
      navigateTo(ADMIN_PATH)
    } catch {
      return
    }
  }

  const handleLogout = async () => {
    await admin.logout()
    navigateTo(ADMIN_LOGIN_PATH)
  }

  return (
    <div id="top">
      <Header currentPath={path} />
      <main>
        {path === REGISTRATION_PATH ? (
          <RegistrationPage
            earlyBird={earlyBird}
            paymentMethod={paymentMethod}
            submittedMessage={submittedMessage}
            submitError={submitError}
            submitting={submitting}
            tuitionTotal={tuitionTotal}
            onToggleEarlyBird={setEarlyBird}
            onPaymentMethodChange={setPaymentMethod}
            onSubmit={handleSubmit}
          />
        ) : null}

        {path === CALENDAR_PATH ? <CalendarPage /> : null}

        {path === NEWS_PATH ? <NewsPage /> : null}

        {newsPostId ? <NewsDetailPage postId={newsPostId} /> : null}

        {path === ADMIN_LOGIN_PATH ? (
          <AdminLoginPage error={admin.error} loading={admin.working} onSubmit={handleAdminLogin} />
        ) : null}

        {path === ADMIN_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="home" onLogout={handleLogout} />
            <AdminHomePage />
          </AdminRoute>
        ) : null}

        {path === ADMIN_REGISTRATIONS_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="registrations" onLogout={handleLogout} />
            <AdminRegistrationsPage />
          </AdminRoute>
        ) : null}

        {path === ADMIN_ANNOUNCEMENTS_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="announcements" onLogout={handleLogout} />
            <AdminAnnouncementsPage />
          </AdminRoute>
        ) : null}

        {path === ADMIN_ANNOUNCEMENTS_NEW_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="announcements" onLogout={handleLogout} />
            <AdminAnnouncementsPage createOnly />
          </AdminRoute>
        ) : null}

        {path === ADMIN_NEWS_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="news" onLogout={handleLogout} />
            <AdminNewsPage />
          </AdminRoute>
        ) : null}

        {path === ADMIN_NEWS_NEW_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="news" onLogout={handleLogout} />
            <AdminNewsPage createOnly />
          </AdminRoute>
        ) : null}

        {path === ADMIN_CALENDAR_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="calendar" onLogout={handleLogout} />
            <AdminCalendarPage />
          </AdminRoute>
        ) : null}

        {path === ADMIN_CALENDAR_NEW_PATH ? (
          <AdminRoute status={admin.status}>
            <AdminSubhero activeSection="calendar" onLogout={handleLogout} />
            <AdminCalendarPage createOnly />
          </AdminRoute>
        ) : null}

        {path === HOME_PATH ? <HomePage /> : null}
      </main>
      <Footer currentPath={path} />
    </div>
  )
}

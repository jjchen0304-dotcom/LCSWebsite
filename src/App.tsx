import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock, CreditCard, MapPin, Megaphone, ShieldCheck } from 'lucide-react'
import Header from './components/Header'
import Footer from './components/Footer'
import { siteData } from './data/siteData'

const HOME_PATH = '/'
const REGISTRATION_PATH = '/registration'
const CALENDAR_PATH = '/calendar'
const baseTuition = 150
const earlyBirdDiscount = 5
const earlyBirdDeadline = new Date('2026-01-11T23:59:59')
const isEarlyBirdAvailable = new Date() <= earlyBirdDeadline

function getCurrentPath() {
  if (typeof window === 'undefined') return HOME_PATH
  if (window.location.pathname === REGISTRATION_PATH) return REGISTRATION_PATH
  if (window.location.pathname === CALENDAR_PATH) return CALENDAR_PATH
  return HOME_PATH
}

function navigateTo(href: string) {
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
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function SmartLink({
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

  return <a
    className={className}
    href={href}
    onClick={(event) => {
      event.preventDefault()
      navigateTo(href.startsWith('#') ? `${HOME_PATH}${href}` : href)
    }}
  >{children}</a>
}

function HomePage() {
  return <>
    <section className="hero">
      <div className="hero-art" aria-hidden="true"><div className="sun"/><img className="mountain" src="/zhangjiajie-transparent-final.png" alt="" /></div>
      <div className="container hero-content"><div><p className="eyebrow">Welcome</p><h1>Language, culture, and community.</h1><p className="lead">Explore programs, learn about school life, and find a place for families to grow through Chinese language and heritage.</p><div className="hero-actions"><SmartLink className="button primary" href={REGISTRATION_PATH}>Visit registration <ArrowRight size={18}/></SmartLink><SmartLink className="button secondary" href="/#programs">Explore Programs</SmartLink></div></div></div>
    </section>
    <section className="announcement"><div className="container announcement-inner"><Megaphone/><div><strong>Spring 2026 dates</strong><span>School resumes on January 11, 2026. Sunday classes run from 2:00 to 4:00 p.m. at Patterson Hall, 120 Campus Drive, Lexington, Kentucky 40508.</span></div><SmartLink href={REGISTRATION_PATH}>Registration page <ChevronRight size={17}/></SmartLink></div></section>
    <section id="about" className="about section"><div className="container split"><div className="photo-panel"><div className="character">文</div><span>Community photo placeholder</span></div><div><p className="eyebrow gold">About our school</p><h2>Rooted in Lexington since {siteData.school.founded}</h2><p>Lexington Chinese School is a nonprofit organization committed to serving the Lexington community through the study of Chinese language, culture, and heritage.</p><p>Its classes have been designed for both Chinese-speaking and non-Chinese-speaking families, creating a place where students can strengthen communication skills while building meaningful cultural connections.</p><div className="facts"><div><strong>1995</strong><span>Established</span></div><div><strong>All ages</strong><span>Pre-K through adult</span></div><div><strong>4 skills</strong><span>Listen, speak, read, write</span></div></div><SmartLink className="text-link" href="/#programs">Learn more about LCS <ArrowRight size={17}/></SmartLink></div></div></section>
    <section className="shortcuts section"><div className="container"><div className="section-heading"><p className="eyebrow red">Popular shortcuts</p><h2>Find what your family needs</h2></div><div className="shortcut-grid">{siteData.shortcuts.map(({label,detail,icon:Icon,href})=><SmartLink className="shortcut" key={label} href={href}><span className="icon"><Icon/></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight/></SmartLink>)}</div></div></section>
    <section id="programs" className="programs section"><div className="container"><div className="section-heading centered"><p className="eyebrow gold">Learning at LCS</p><h2>Programs for every stage</h2><p>Class placement and offerings should be confirmed for the upcoming academic year.</p></div><div className="program-grid">{siteData.programs.map(({title,subtitle,description,icon:Icon})=><article className="program-card" key={title}><Icon/><p className="chinese">{subtitle}</p><h3>{title}</h3><p>{description}</p><SmartLink href={siteData.school.registrationUrl}>View registration <ArrowRight size={16}/></SmartLink></article>)}</div></div></section>
    <section id="events" className="events section"><div className="container"><div className="section-heading row"><div><p className="eyebrow red">News & calendar</p><h2>What’s happening at LCS</h2></div><SmartLink className="text-link" href={CALENDAR_PATH}>View full calendar <ArrowRight size={17}/></SmartLink></div><div className="event-grid"><article className="featured-event"><span className="date"><strong>2026</strong><small>–27</small></span><div><p className="tag">Admissions</p><h3>Registration preparation is underway</h3><p>The current registration portal says it is preparing for the 2026–2027 academic year.</p><SmartLink href={siteData.school.registrationUrl}>Open registration page <ArrowRight size={16}/></SmartLink></div></article><div className="event-list"><article><CalendarDays/><div><p className="tag">Schedule</p><h3>Sunday language classes</h3><p><Clock size={15}/> Archived materials list 2:00–4:00 p.m. Confirm before launch.</p></div></article><article><MapPin/><div><p className="tag">Location</p><h3>Central Lexington classroom location</h3><p>Archived 2024 registration materials list 120 Campus Drive. Confirm current venue.</p></div></article><article><Megaphone/><div><p className="tag">Community</p><h3>School news and celebrations</h3><p>This area is ready for Lunar New Year, performances, enrollment, and volunteer updates.</p></div></article></div></div></div></section>
    <section id="community" className="community"><div className="container"><p className="eyebrow gold">Our community</p><h2>Help language and heritage thrive.</h2><p>Families, teachers, volunteers, and community partners make Lexington Chinese School possible.</p><div><SmartLink className="button light" href="/#contact">Volunteer with LCS</SmartLink><SmartLink className="button outline-light" href="/#contact">Support the school</SmartLink></div></div></section>
  </>
}

function CalendarPage() {
  return <>
    <section className="subhero calendar-hero">
      <div className="container subhero-inner">
        <div>
          <p className="eyebrow red">Calendar</p>
          <h1>Spring 2026 calendar</h1>
        </div>
        <SmartLink className="text-link back-link" href={HOME_PATH}><ArrowRight size={17}/> Back home</SmartLink>
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
        <div className="calendar-grid">
          <article className="calendar-card">
            <h3>January 2026</h3>
            <ul className="calendar-list">
              <li><strong>January 11</strong><span>First day of spring semester classes</span></li>
              <li><strong>January 18</strong><span>Regular classes and family orientation follow-up</span></li>
              <li><strong>January 25</strong><span>Regular classes</span></li>
            </ul>
          </article>
          <article className="calendar-card">
            <h3>February 2026</h3>
            <ul className="calendar-list">
              <li><strong>February 1</strong><span>Regular classes</span></li>
              <li><strong>February 8</strong><span>Lunar New Year celebration program</span></li>
              <li><strong>February 15</strong><span>No classes for holiday weekend</span></li>
              <li><strong>February 22</strong><span>Regular classes resume</span></li>
            </ul>
          </article>
          <article className="calendar-card">
            <h3>March 2026</h3>
            <ul className="calendar-list">
              <li><strong>March 1</strong><span>Regular classes</span></li>
              <li><strong>March 15</strong><span>Mid-semester parent check-in</span></li>
              <li><strong>March 29</strong><span>Regular classes</span></li>
            </ul>
          </article>
          <article className="calendar-card">
            <h3>April 2026</h3>
            <ul className="calendar-list">
              <li><strong>April 5</strong><span>No classes for spring holiday</span></li>
              <li><strong>April 12</strong><span>Regular classes resume</span></li>
              <li><strong>April 26</strong><span>Student performance rehearsal</span></li>
            </ul>
          </article>
          <article className="calendar-card">
            <h3>May 2026</h3>
            <ul className="calendar-list">
              <li><strong>May 3</strong><span>Final regular class meeting</span></li>
              <li><strong>May 10</strong><span>Spring showcase and closing celebration</span></li>
            </ul>
          </article>
          <aside className="verification">
            <strong>Please verify before publishing</strong>
            <p>This calendar is a polished placeholder for the public site. Final classroom dates, holiday closures, and event times should be confirmed by school leadership before launch.</p>
          </aside>
        </div>
      </div>
    </section>
  </>
}

function RegistrationPage({
  earlyBird,
  paymentMethod,
  submitted,
  tuitionTotal,
  onToggleEarlyBird,
  onPaymentMethodChange,
  onSubmit,
}: {
  earlyBird: boolean
  paymentMethod: string
  submitted: boolean
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
    if (!form) return { invalid: [], isComplete: false }

    const formData = new FormData(form)
    const missingErrors: string[] = []
    const invalid: string[] = []

    const requiredFields = [
      ['parentName', 'Enter a parent or guardian name.'],
      ['email', 'Enter an email address.'],
      ['phone', 'Enter a phone number.'],
      ['address', 'Enter an address.'],
      ['studentName', 'Enter a student name.'],
      ['age', 'Enter the student age.'],
      ['grade', 'Select a grade level.'],
      ['program', 'Select a program.'],
      ['classPreference', 'Select a class preference.'],
    ] as const

    for (const [field, message] of requiredFields) {
      const value = String(formData.get(field) || '').trim()
      if (value.length === 0) {
        invalid.push(field)
        missingErrors.push(message)
      }
    }

    if (!String(formData.get('paymentMethod') || '').trim()) {
      invalid.push('paymentMethod')
      missingErrors.push('Choose a payment method.')
    }

    if (!formData.get('termsAccepted')) {
      invalid.push('termsAccepted')
      missingErrors.push('Agree to the terms and conditions.')
    }

    setInvalidFields(invalid)
    setFormReady(missingErrors.length === 0)

    return { invalid, isComplete: missingErrors.length === 0 }
  }

  useEffect(() => {
    evaluateForm()
  }, [earlyBird, paymentMethod])

  const handleFormUpdate = () => {
    evaluateForm()
  }

  const actionContent = <>
    <button className="button primary" type="submit" disabled={!formReady} title={formReady ? undefined : 'Complete all required fields to enable submission'}>
      Submit registration request <ArrowRight size={18}/>
    </button>
    {submitted && <p className="form-success"><CheckCircle2 size={18}/> Registration details captured for this demo layout.</p>}
  </>

  return <>
    <section className="subhero registration-hero">
        <div className="container subhero-inner">
        <div>
          <h1>Registration</h1>
        </div>
        <div className="registration-badge"><ShieldCheck size={18}/> Spring 2026 enrollment</div>
        <SmartLink className="text-link back-link" href={HOME_PATH}><ArrowRight size={17}/> Back home</SmartLink>
      </div>
    </section>
    <section id="registration" className="registration section">
      <div className="container">
        <div className="section-heading row">
          <div><p className="eyebrow red">Registration form</p><h2>Student registration</h2><p>Complete the form below to share family details, program preferences, and enrollment information.</p></div>
        </div>
        <div className="registration-layout">
          <form className="registration-form" id="registration-form" ref={formRef} onInput={handleFormUpdate} onChange={handleFormUpdate} onSubmit={onSubmit}>
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
            <div className="form-actions">
              {actionContent}
            </div>
          </form>
          <aside className="registration-sidebar">
            <div className="summary-card">
              <div className="summary-heading"><CreditCard size={20}/><h3>Tuition summary</h3></div>
              <div className="summary-row"><span>Base tuition</span><strong>${baseTuition.toFixed(2)}</strong></div>
              <div className="summary-row"><span>Early-bird discount</span><strong>{earlyBird && isEarlyBirdAvailable ? '-$5.00' : '$0.00'}</strong></div>
              <div className="summary-row total"><span>Total tuition</span><strong>${tuitionTotal.toFixed(2)}</strong></div>
              <p>{isEarlyBirdAvailable ? 'Spring 2026 early-bird pricing ends on January 11, 2026.' : 'Early-bird pricing deadline passed on January 11, 2026.'}</p>
            </div>
            <div className="mobile-submit">
              {actionContent}
            </div>
            <div className="summary-card">
              <div className="summary-heading"><CalendarDays size={20}/><h3>Important notes</h3></div>
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
    {showTerms && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-title">
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
    </div>}
  </>
}

export default function App(){
  const [path, setPath] = useState(getCurrentPath)
  const [earlyBird, setEarlyBird] = useState(isEarlyBirdAvailable)
  const [paymentMethod, setPaymentMethod] = useState('zelle')
  const [submitted, setSubmitted] = useState(false)
  const tuitionTotal = baseTuition - (earlyBird && isEarlyBirdAvailable ? earlyBirdDiscount : 0)

  useEffect(() => {
    const handlePopstate = () => setPath(getCurrentPath())
    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return <div id="top">
    <Header currentPath={path}/>
    <main>
      {path === REGISTRATION_PATH
        ? <RegistrationPage
            earlyBird={earlyBird}
            paymentMethod={paymentMethod}
            submitted={submitted}
            tuitionTotal={tuitionTotal}
            onToggleEarlyBird={setEarlyBird}
            onPaymentMethodChange={setPaymentMethod}
            onSubmit={handleSubmit}
          />
        : path === CALENDAR_PATH
        ? <CalendarPage/>
        : <HomePage/>
      }
    </main>
    <Footer currentPath={path}/>
  </div>
}

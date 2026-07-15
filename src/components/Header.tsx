import { Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { siteData } from '../data/siteData'
import { CALENDAR_PATH, HOME_PATH, NEWS_PATH, REGISTRATION_PATH, SmartLink } from '../lib/router'

const nav = [
  { label: 'About', href: '/#about' },
  { label: 'Registration', href: '/#registration-home' },
  { label: 'News', href: '/#news' },
  { label: 'Programs', href: '/#programs' },
  { label: 'Calendar', href: '/#calendar' },
  { label: 'Contribute', href: '/#community' },
  { label: 'Contact', href: '/#contact' },
]

const homeSections = ['about', 'registration-home', 'news', 'programs', 'calendar', 'community', 'contact'] as const

function getInitialHomeSection() {
  if (typeof window === 'undefined') return 'about'

  const hash = window.location.hash.replace('#', '')
  return homeSections.includes(hash as (typeof homeSections)[number])
    ? hash
    : 'about'
}

export default function Header({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false)
  const [activeHomeSection, setActiveHomeSection] = useState<string>(getInitialHomeSection)
  const scrollFrameRef = useRef<number | null>(null)
  const isAdminView = currentPath.startsWith('/admin')

  useEffect(() => {
    if (currentPath !== HOME_PATH) return

    const updateActiveSection = () => {
      const headerOffset = 140
      const bottomThreshold = 12

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - bottomThreshold) {
        setActiveHomeSection('contact')
        return
      }

      let nextActive: string = homeSections[0]

      for (const sectionId of homeSections) {
        const section = document.getElementById(sectionId)
        if (!section) continue

        const sectionTop = section.getBoundingClientRect().top

        if (sectionTop <= headerOffset) {
          nextActive = sectionId
        } else {
          break
        }
      }

      setActiveHomeSection(nextActive)
    }

    updateActiveSection()

    const handleScroll = () => {
      if (scrollFrameRef.current != null) return

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null
        updateActiveSection()
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('popstate', updateActiveSection)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('popstate', updateActiveSection)
      if (scrollFrameRef.current != null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
      }
    }
  }, [currentPath])

  useEffect(() => {
    if (currentPath !== HOME_PATH) return
    setActiveHomeSection(getInitialHomeSection())
  }, [currentPath])

  const getIsActive = (label: string) => {
    if (currentPath === REGISTRATION_PATH) return label === 'Registration'
    if (currentPath === NEWS_PATH) return label === 'News'
    if (currentPath === CALENDAR_PATH) return label === 'Calendar'
    if (currentPath !== HOME_PATH) return false

    if (label === 'About') return activeHomeSection === 'about'
    if (label === 'Registration') return activeHomeSection === 'registration-home'
    if (label === 'News') return activeHomeSection === 'news'
    if (label === 'Programs') return activeHomeSection === 'programs'
    if (label === 'Calendar') return activeHomeSection === 'calendar'
    if (label === 'Contribute') return activeHomeSection === 'community'
    if (label === 'Contact') return activeHomeSection === 'contact'

    return false
  }

  return <>
    <div className="utility"><div className="container utility-inner"><span>Lexington, Kentucky</span><div><a href="/calendar">Calendar</a><button>中文</button></div></div></div>
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href={currentPath === '/' ? '/#top' : '/'} aria-label="Lexington Chinese School home">
          <span className="brand-mark"><img className="brand-logo" src="/lcs-bear-clean.png" alt="Lexington Chinese School bear mark" /></span>
          <span className="brand-copy"><strong>{siteData.school.name}</strong><small>{siteData.school.chineseName}</small><em>EST 1995</em></span>
        </a>
        {!isAdminView ? <nav className="desktop-nav">{nav.map(item => <SmartLink key={item.label} className={getIsActive(item.label) ? 'active' : undefined} href={item.href}>{item.label}</SmartLink>)}<button className="search" aria-label="Search"><Search size={19}/></button></nav> : null}
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
      </div>
      {open && (
        <nav className="mobile-nav">
          {nav.map(item => <SmartLink key={item.label} className={getIsActive(item.label) ? 'active' : undefined} href={item.href}><span onClick={() => setOpen(false)}>{item.label}</span></SmartLink>)}
        </nav>
      )}
    </header>
  </>
}

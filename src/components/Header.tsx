import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { siteData } from '../data/siteData'
const nav = [
  { label: 'About', href: '/#about' },
  { label: 'Programs', href: '/#programs' },
  { label: 'News', href: '/news' },
  { label: 'Registration', href: '/registration' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Contact', href: '/#contact' },
]

export default function Header({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false)
  const isAdminView = currentPath.startsWith('/admin')

  return <>
    <div className="utility"><div className="container utility-inner"><span>Lexington, Kentucky</span><div><a href="/calendar">Calendar</a><button>中文</button></div></div></div>
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href={currentPath === '/' ? '/#top' : '/'} aria-label="Lexington Chinese School home">
          <span className="brand-mark"><img className="brand-logo" src="/lcs-bear-clean.png" alt="Lexington Chinese School bear mark" /></span>
          <span className="brand-copy"><strong>{siteData.school.name}</strong><small>{siteData.school.chineseName}</small><em>EST 1995</em></span>
        </a>
        {!isAdminView ? <nav className="desktop-nav">{nav.map(item => <a key={item.label} href={item.href}>{item.label}</a>)}<button className="search" aria-label="Search"><Search size={19}/></button></nav> : null}
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
      </div>
      {open && (
        <nav className="mobile-nav">
          {nav.map(item => <a key={item.label} onClick={() => setOpen(false)} href={item.href}>{item.label}</a>)}
        </nav>
      )}
    </header>
  </>
}

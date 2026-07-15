import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { siteData } from '../data/siteData'
import { ADMIN_LOGIN_PATH, SmartLink } from '../lib/router'

export default function Footer({ currentPath: _currentPath }: { currentPath: string }) {
  return (
    <footer id="contact">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">
              <img className="brand-logo" src="/lcs-bear-clean.png" alt="Lexington Chinese School bear mark" />
            </span>
            <span className="brand-copy">
              <strong>{siteData.school.name}</strong>
              <small>{siteData.school.chineseName}</small>
              <em>EST 1995</em>
            </span>
          </div>
          <p>A nonprofit community school supporting Chinese language, culture, and heritage education in Central Kentucky.</p>
        </div>

        <div>
          <h3>Contact</h3>
          <p><MapPin size={17} />{siteData.school.address}</p>
          <p><Phone size={17} />Phone to be confirmed</p>
          <p><Mail size={17} />{siteData.school.registrationEmail}</p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <a href="/#about">About</a>
          <a href="/#programs">Programs</a>
          <a href="/news">News</a>
          <a href={siteData.school.registrationUrl}>Registration</a>
          <a href="/calendar">Calendar</a>
        </div>

        <div>
          <h3>Connect</h3>
          <a href={siteData.school.facebookUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} /> Facebook
          </a>
          <a href="/#community">Volunteer with LCS</a>
          <a href="/#community">Support the School</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 Lexington Chinese School. Demo website.</span>
        <span>Accessibility · Privacy · Nondiscrimination</span>
        <SmartLink className="footer-admin-link" href={ADMIN_LOGIN_PATH}>Admin</SmartLink>
      </div>
    </footer>
  )
}

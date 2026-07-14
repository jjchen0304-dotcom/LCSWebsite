import { BookOpen, CalendarDays, Contact, FileText, HeartHandshake, Languages, Palette, School } from 'lucide-react'

export const siteData = {
  school: {
    name: 'Lexington Chinese School',
    chineseName: '列克星敦中文学校',
    founded: '1995',
    mission: 'Serving the Lexington community through the study of Chinese language, culture, and heritage.',
    address: '120 Campus Drive, Lexington, KY 40508',
    schedule: 'Sundays, 2:00–4:00 p.m.',
    registrationUrl: '/registration',
    facebookUrl: 'https://www.facebook.com/LexingtonChineseSchool/',
    registrationEmail: 'register@lexingtonchineseschool.org',
  },
  shortcuts: [
    { label: 'Register for Classes', detail: 'Visit the full Spring 2026 registration page', icon: FileText, href: '/registration' },
    { label: 'School Calendar', detail: 'View classes, breaks, and celebrations', icon: CalendarDays, href: '/calendar' },
    { label: 'Explore Programs', detail: 'Language and cultural enrichment', icon: BookOpen, href: '/#programs' },
    { label: 'Volunteer', detail: 'Support school and community events', icon: HeartHandshake, href: '/#community' },
    { label: 'Contact Us', detail: 'Questions about classes or enrollment', icon: Contact, href: '/#contact' },
  ],
  programs: [
    { title: 'Chinese Language', subtitle: '中文课程', description: 'Level-based instruction for learners from pre-kindergarten through adults, with attention to listening, speaking, reading, and writing.', icon: Languages },
    { title: 'Chinese as a Second Language', subtitle: '中文作为第二语言', description: 'Classes designed for children and adults beginning or continuing Chinese outside a Chinese-speaking home.', icon: School },
    { title: 'Culture & Heritage', subtitle: '文化与传统', description: 'Learning that connects language with Chinese customs, traditions, history, geography, and community celebrations.', icon: BookOpen },
    { title: 'Arts & Enrichment', subtitle: '艺术与兴趣课程', description: 'Past offerings have included dance, painting, martial arts, and other non-language enrichment activities.', icon: Palette },
  ],
}

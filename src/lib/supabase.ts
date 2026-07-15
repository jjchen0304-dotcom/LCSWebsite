import { createClient, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const AUTHORIZED_ADMIN_EMAIL = 'admin@gmail.com'
const NEWS_IMAGE_BUCKET = 'news-images'

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

function requireSupabase() {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.')
  }

  return supabase
}

export type RegistrationRow = {
  id: number
  registration_number: string | null
  parent_name: string
  email: string
  phone: string
  address: string
  student_name: string
  chinese_name: string | null
  age: number
  grade: string
  program: string
  class_preference: string
  notes: string | null
  payment_method: 'zelle' | 'check'
  early_bird: boolean
  terms_accepted: boolean
  registration_status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived'
  payment_status: 'unpaid' | 'pending' | 'paid' | 'waived' | 'refunded'
  admin_notes: string | null
  submitted_at: string
  created_at: string
  updated_at: string
}

export type CalendarEventRow = {
  id: number
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  location: string | null
  category: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export type AnnouncementRow = {
  id: number
  title: string
  message: string
  link: string | null
  published: boolean
  archived: boolean
  priority: boolean
  starts_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type NewsPostRow = {
  id: number
  title: string
  summary: string
  body: string
  image_url: string | null
  external_link: string | null
  published: boolean
  archived: boolean
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type RegistrationSubmissionResult = {
  registration_number: string
  submitted_at: string
}

export type AdminSessionStatus = 'loading' | 'verified' | 'signed_out' | 'unauthorized'

export type AdminVerificationResult = {
  email: string | null
  isAdmin: boolean
  session: Session | null
  status: AdminSessionStatus
}

function isPublicCalendarEventVisible(row: CalendarEventRow) {
  const title = row.title.trim().toLowerCase()
  const category = row.category?.trim().toLowerCase() ?? ''

  if (title.startsWith('calendar verify ')) return false
  if (category === 'verification') return false

  return true
}

export async function submitRegistration(payload: {
  parentName: string
  email: string
  phone: string
  address: string
  studentName: string
  chineseName: string
  age: number
  grade: string
  program: string
  classPreference: string
  notes: string
  paymentMethod: 'zelle' | 'check'
  earlyBird: boolean
}) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('submit_registration', {
    p_parent_name: payload.parentName,
    p_email: payload.email,
    p_phone: payload.phone,
    p_address: payload.address,
    p_student_name: payload.studentName,
    p_chinese_name: payload.chineseName || null,
    p_age: payload.age,
    p_grade: payload.grade,
    p_program: payload.program,
    p_class_preference: payload.classPreference,
    p_notes: payload.notes || null,
    p_payment_method: payload.paymentMethod,
    p_early_bird: payload.earlyBird,
    p_terms_accepted: true,
  })

  if (error) throw error

  return (data?.[0] ?? null) as RegistrationSubmissionResult | null
}

export async function fetchPublicCalendarEvents() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('calendar_events')
    .select('*')
    .eq('published', true)
    .order('start_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as CalendarEventRow[]).filter(isPublicCalendarEventVisible)
}

export async function fetchPublicAnnouncements() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('announcements')
    .select('*')
    .eq('published', true)
    .eq('archived', false)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  const now = Date.now()

  return ((data ?? []) as AnnouncementRow[]).filter((row) => {
    const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null
    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null

    if (startsAt != null && startsAt > now) return false
    if (expiresAt != null && expiresAt <= now) return false

    return true
  })
}

export async function getAnnouncements() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('announcements')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as AnnouncementRow[]
}

export async function createAnnouncement(
  input: Omit<AnnouncementRow, 'id' | 'created_at' | 'updated_at'>,
) {
  const client = requireSupabase()
  const { error } = await client.from('announcements').insert(input)
  if (error) throw error
}

export async function updateAnnouncement(
  id: number,
  input: Omit<AnnouncementRow, 'id' | 'created_at' | 'updated_at'>,
) {
  const client = requireSupabase()
  const { error } = await client.from('announcements').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteAnnouncement(id: number) {
  const client = requireSupabase()
  const { error } = await client.from('announcements').delete().eq('id', id)
  if (error) throw error
}

export async function fetchPublicNewsPosts(limit?: number) {
  const client = requireSupabase()
  let query = client
    .from('news_posts')
    .select('*')
    .eq('published', true)
    .eq('archived', false)
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []) as NewsPostRow[]
}

export async function getNewsPosts() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('news_posts')
    .select('*')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as NewsPostRow[]
}

export async function getPublicNewsPost(id: number) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('news_posts')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .eq('archived', false)
    .maybeSingle()

  if (error) throw error

  return (data ?? null) as NewsPostRow | null
}

export async function createNewsPost(input: Omit<NewsPostRow, 'id' | 'created_at' | 'updated_at'>) {
  const client = requireSupabase()
  const { error } = await client.from('news_posts').insert(input)
  if (error) throw error
}

function getUploadExtension(file: File) {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase()
  if (fromName) return fromName.replace(/[^a-z0-9]/g, '') || 'jpg'

  const fromType = file.type.split('/').pop()?.trim().toLowerCase()
  return fromType?.replace(/[^a-z0-9]/g, '') || 'jpg'
}

export async function uploadNewsImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const client = requireSupabase()
  const extension = getUploadExtension(file)
  const path = `articles/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`

  const { error } = await client.storage
    .from(NEWS_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })

  if (error) throw error

  const { data } = client.storage.from(NEWS_IMAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function updateNewsPost(
  id: number,
  input: Omit<NewsPostRow, 'id' | 'created_at' | 'updated_at'>,
) {
  const client = requireSupabase()
  const { error } = await client.from('news_posts').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteNewsPost(id: number) {
  const client = requireSupabase()
  const { error } = await client.from('news_posts').delete().eq('id', id)
  if (error) throw error
}

export async function getRegistrations() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('registrations')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as RegistrationRow[]
}

export async function updateRegistration(
  id: number,
  patch: Pick<RegistrationRow, 'registration_status' | 'payment_status' | 'admin_notes'>,
) {
  const client = requireSupabase()
  const { error } = await client
    .from('registrations')
    .update({
      registration_status: patch.registration_status,
      payment_status: patch.payment_status,
      admin_notes: patch.admin_notes,
    })
    .eq('id', id)

  if (error) throw error
}

export async function getAdminEvents() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('calendar_events')
    .select('*')
    .order('start_at', { ascending: true })

  if (error) throw error

  return (data ?? []) as CalendarEventRow[]
}

export async function createEvent(input: Omit<CalendarEventRow, 'id' | 'created_at' | 'updated_at'>) {
  const client = requireSupabase()
  const { error } = await client.from('calendar_events').insert(input)
  if (error) throw error
}

export async function updateEvent(
  id: number,
  input: Omit<CalendarEventRow, 'id' | 'created_at' | 'updated_at'>,
) {
  const client = requireSupabase()
  const { error } = await client.from('calendar_events').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteEvent(id: number) {
  const client = requireSupabase()
  const { error } = await client.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

async function verifyAdmin(session: Session | null): Promise<AdminVerificationResult> {
  if (!session) {
    return {
      email: null,
      isAdmin: false,
      session: null,
      status: 'signed_out',
    }
  }

  const email = session.user.email?.trim().toLowerCase() ?? null

  if (email !== AUTHORIZED_ADMIN_EMAIL) {
    return {
      email,
      isAdmin: false,
      session,
      status: 'unauthorized',
    }
  }

  const client = requireSupabase()
  const { data, error } = await client
    .from('app_settings')
    .select('value')
    .eq('key', 'admin_email')
    .single()

  if (error || data?.value?.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) {
    return {
      email,
      isAdmin: false,
      session,
      status: 'unauthorized',
    }
  }

  return {
    email,
    isAdmin: true,
    session,
    status: 'verified',
  }
}

export async function signInAdmin(email: string, password: string) {
  const client = requireSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  const { data, error } = await client.auth.signInWithPassword({ email: normalizedEmail, password })
  if (error) throw error

  const result = await verifyAdmin(data.session)
  if (result.status !== 'verified') {
    await client.auth.signOut()
    throw new Error(
      normalizedEmail === AUTHORIZED_ADMIN_EMAIL
        ? 'This account is not authorized to access admin tools.'
        : 'Only the approved admin account can sign in here.',
    )
  }
}

export async function signOutAdmin() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function checkAdminSession() {
  const client = requireSupabase()
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession()

  if (sessionError) throw sessionError

  const result = await verifyAdmin(session)

  if (result.status === 'unauthorized') {
    await client.auth.signOut()
  }

  return result
}

export { AUTHORIZED_ADMIN_EMAIL }

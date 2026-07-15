import { CheckCircle2, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  type AnnouncementRow,
} from '../lib/supabase'
import { ADMIN_ANNOUNCEMENTS_NEW_PATH, ADMIN_ANNOUNCEMENTS_PATH, navigateTo } from '../lib/router'

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => `${part}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function sortAnnouncements(rows: AnnouncementRow[]) {
  return [...rows].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority ? -1 : 1
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })
}

export default function AdminAnnouncementsPage({
  createOnly = false,
}: {
  createOnly?: boolean
}) {
  const [rows, setRows] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AnnouncementRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const formRef = useRef<HTMLFormElement | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const nextRows = sortAnnouncements(await getAnnouncements())
      setRows(nextRows)
      setEditing((current) => current ? nextRows.find((row) => row.id === current.id) ?? null : current)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (createOnly) {
      setIsComposerOpen(true)
    }
  }, [createOnly])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        [row.title, row.message, row.link]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      if (statusFilter === 'published') return matchesSearch && row.published && !row.archived
      if (statusFilter === 'draft') return matchesSearch && !row.published && !row.archived
      if (statusFilter === 'archived') return matchesSearch && row.archived

      return matchesSearch
    })
  }, [rows, search, statusFilter])

  const focusForm = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleStartCreate = () => {
    if (!createOnly) {
      navigateTo(ADMIN_ANNOUNCEMENTS_NEW_PATH)
      return
    }

    setIsComposerOpen(true)
    setEditing(null)
    setSaveMessage(null)
    setSaveError(null)
    setValidationError(null)
    setFormVersion((value) => value + 1)
    focusForm()
  }

  const handleStartEdit = (row: AnnouncementRow) => {
    setIsComposerOpen(true)
    setEditing(row)
    setSaveMessage(null)
    setSaveError(null)
    setValidationError(null)
    focusForm()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveMessage(null)
    setSaveError(null)
    setValidationError(null)

    const formData = new FormData(event.currentTarget)
    const startsAt = String(formData.get('starts_at') || '')
    const expiresAt = String(formData.get('expires_at') || '')

    if (!String(formData.get('title') || '').trim()) {
      setValidationError('Title is required.')
      return
    }

    if (!String(formData.get('message') || '').trim()) {
      setValidationError('Message is required.')
      return
    }

    if (startsAt && expiresAt && new Date(expiresAt).getTime() < new Date(startsAt).getTime()) {
      setValidationError('Expiration must be later than the start date.')
      return
    }

    setSaving(true)

    const payload = {
      title: String(formData.get('title') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      link: String(formData.get('link') || '').trim() || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      priority: formData.get('priority') === 'on',
      published: formData.get('published') === 'on',
      archived: formData.get('archived') === 'on',
    }

    try {
      if (editing) {
        await updateAnnouncement(editing.id, payload)
        setSaveMessage('Announcement updated.')
      } else {
        await createAnnouncement(payload)
        setSaveMessage('Announcement created.')
      }

      await load()
      if (createOnly) {
        navigateTo(ADMIN_ANNOUNCEMENTS_PATH)
        return
      }

      setIsComposerOpen(false)
      setEditing(null)
      setFormVersion((value) => value + 1)
      event.currentTarget.reset()
    } catch (announcementError) {
      setSaveError(announcementError instanceof Error ? announcementError.message : 'Unable to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: AnnouncementRow) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return

    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    try {
      await deleteAnnouncement(row.id)
      setRows((current) => current.filter((item) => item.id !== row.id))
      if (editing?.id === row.id) setEditing(null)
      setSaveMessage('Announcement deleted.')
    } catch (announcementError) {
      setSaveError(announcementError instanceof Error ? announcementError.message : 'Unable to delete announcement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="registration section">
      <div className="container admin-shell">
        <div className="admin-header-row">
          <div>
            <h2>{createOnly ? 'Create announcement' : 'Announcements'}</h2>
            <p className="admin-copy">
              {createOnly ? 'Add a new homepage announcement in a dedicated create screen.' : 'Manage short homepage notices without changing the site design.'}
            </p>
          </div>
          {!createOnly ? (
            <button className="button secondary admin-secondary" type="button" onClick={handleStartCreate}>
              <Plus size={18} />
              New announcement
            </button>
          ) : (
            <button className="button secondary admin-secondary" type="button" onClick={() => navigateTo(ADMIN_ANNOUNCEMENTS_PATH)}>
              Back to announcements
            </button>
          )}
        </div>

        {!createOnly ? (
        <div className="form-card admin-toolbar">
          <label className="admin-search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, message, or link"
            />
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All announcements</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        ) : null}

        {loading ? <p className="loading-note"><LoaderCircle size={18} /> Loading announcements…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!loading && !error && !createOnly ? (
          <>
            <div className={`summary-card admin-results-card${editing ? ' admin-results-card-split' : ''}`}>
              <div className="admin-results-header">
                <h3>Announcements</h3>
                <span>{filteredRows.length}</span>
              </div>
              {filteredRows.length === 0 ? (
                <p className="admin-empty">No announcements match the current filters.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Visibility</th>
                        <th>Starts</th>
                        <th>Expires</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id} className={row.id === editing?.id ? 'active' : undefined}>
                          <td>{row.title}</td>
                          <td>{row.priority ? 'Priority' : 'Normal'}</td>
                          <td>{row.archived ? 'Archived' : row.published ? 'Published' : 'Draft'}</td>
                          <td>{formatDateTime(row.starts_at)}</td>
                          <td>{formatDateTime(row.expires_at)}</td>
                          <td>
                            <div className="admin-row-actions">
                              <button className="button secondary admin-secondary" type="button" onClick={() => handleStartEdit(row)}>
                                Edit
                              </button>
                              <button className="button secondary admin-danger" type="button" onClick={() => void handleDelete(row)}>
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {editing ? (
              <form
                ref={formRef}
                className="form-card admin-detail-card admin-detail-card-floating"
                key={`${editing?.id ?? 'new'}-${formVersion}`}
                onSubmit={handleSubmit}
              >
                <div className="admin-detail-header">
                  <div>
                    <h3>{editing ? 'Edit announcement' : 'Create announcement'}</h3>
                    <p>{editing ? 'Update the selected announcement.' : 'Add a new homepage announcement.'}</p>
                  </div>
                  <button className="button secondary admin-secondary" type="button" onClick={() => setIsComposerOpen(false)}>
                    Close
                  </button>
                </div>

                <div className="field-grid">
                  <label>
                    <span>Title</span>
                    <input name="title" defaultValue={editing?.title || ''} required />
                  </label>
                  <label>
                    <span>Optional link</span>
                    <input name="link" defaultValue={editing?.link || ''} placeholder="/registration or https://..." />
                  </label>
                  <label>
                    <span>Starts at</span>
                    <input name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(editing?.starts_at || null)} />
                  </label>
                  <label>
                    <span>Expires at</span>
                    <input name="expires_at" type="datetime-local" defaultValue={toDateTimeLocal(editing?.expires_at || null)} />
                  </label>
                  <label className="toggle-row">
                    <input name="priority" type="checkbox" defaultChecked={editing?.priority || false} />
                    <span>Priority announcement</span>
                  </label>
                  <label className="toggle-row">
                    <input name="published" type="checkbox" defaultChecked={editing?.published || false} />
                    <span>Published</span>
                  </label>
                  <label className="toggle-row">
                    <input name="archived" type="checkbox" defaultChecked={editing?.archived || false} />
                    <span>Archived</span>
                  </label>
                </div>

                <label className="full-width">
                  <span>Message</span>
                  <textarea name="message" rows={5} defaultValue={editing?.message || ''} required />
                </label>

                <div className="form-actions admin-form-actions">
                  <button className="button primary" type="submit" disabled={saving}>
                    {saving ? <><LoaderCircle size={18} /> Saving…</> : 'Save announcement'}
                  </button>
                </div>
                {validationError ? <p className="form-error">{validationError}</p> : null}
                {saveMessage ? <p className="form-success"><CheckCircle2 size={18} /> {saveMessage}</p> : null}
                {saveError ? <p className="form-error">{saveError}</p> : null}
              </form>
            ) : null}
          </>
        ) : null}

        {!loading && !error && createOnly && isComposerOpen ? (
          <form
            ref={formRef}
            className="form-card admin-detail-card admin-detail-card-single"
            key={`${editing?.id ?? 'new'}-${formVersion}`}
            onSubmit={handleSubmit}
          >
            <div className="admin-detail-header">
              <div>
                <h3>Create announcement</h3>
                <p>Add a new homepage announcement.</p>
              </div>
              <button className="button secondary admin-secondary" type="button" onClick={() => navigateTo(ADMIN_ANNOUNCEMENTS_PATH)}>
                Cancel
              </button>
            </div>

            <div className="field-grid">
              <label>
                <span>Title</span>
                <input name="title" defaultValue="" required />
              </label>
              <label>
                <span>Optional link</span>
                <input name="link" defaultValue="" placeholder="/registration or https://..." />
              </label>
              <label>
                <span>Starts at</span>
                <input name="starts_at" type="datetime-local" defaultValue="" />
              </label>
              <label>
                <span>Expires at</span>
                <input name="expires_at" type="datetime-local" defaultValue="" />
              </label>
              <div className="admin-toggle-group full-width">
                <label className="toggle-row">
                  <input name="priority" type="checkbox" defaultChecked={false} />
                  <span>Priority announcement</span>
                </label>
                <label className="toggle-row">
                  <input name="published" type="checkbox" defaultChecked={false} />
                  <span>Published</span>
                </label>
                <label className="toggle-row">
                  <input name="archived" type="checkbox" defaultChecked={false} />
                  <span>Archived</span>
                </label>
              </div>
            </div>

            <label className="full-width">
              <span>Message</span>
              <textarea name="message" rows={5} defaultValue="" required />
            </label>

            <div className="form-actions admin-form-actions">
              <button className="button primary" type="submit" disabled={saving}>
                {saving ? <><LoaderCircle size={18} /> Saving…</> : 'Save announcement'}
              </button>
            </div>
            {validationError ? <p className="form-error">{validationError}</p> : null}
            {saveMessage ? <p className="form-success"><CheckCircle2 size={18} /> {saveMessage}</p> : null}
            {saveError ? <p className="form-error">{saveError}</p> : null}
          </form>
        ) : null}
      </div>
    </section>
  )
}

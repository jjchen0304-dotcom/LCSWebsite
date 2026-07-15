import { CheckCircle2, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createEvent,
  deleteEvent,
  getAdminEvents,
  updateEvent,
  type CalendarEventRow,
} from '../lib/supabase'
import { ADMIN_CALENDAR_NEW_PATH, ADMIN_CALENDAR_PATH, navigateTo } from '../lib/router'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (part: number) => `${part}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function sortEvents(rows: CalendarEventRow[]) {
  return [...rows].sort((left, right) => {
    const leftTime = new Date(left.start_at).getTime()
    const rightTime = new Date(right.start_at).getTime()
    return leftTime - rightTime
  })
}

export default function AdminCalendarPage({
  createOnly = false,
}: {
  createOnly?: boolean
}) {
  const [rows, setRows] = useState<CalendarEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<CalendarEventRow | null>(null)
  const [search, setSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
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
      const nextRows = sortEvents(await getAdminEvents())
      setRows(nextRows)
      setEditing((current) => current ? nextRows.find((row) => row.id === current.id) ?? null : current)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load calendar events.')
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

  const categories = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => row.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        [row.title, row.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      const matchesPublished =
        publishedFilter === 'all' ||
        (publishedFilter === 'published' ? row.published : !row.published)

      const matchesCategory =
        categoryFilter === 'all' || row.category === categoryFilter

      return matchesSearch && matchesPublished && matchesCategory
    })
  }, [categoryFilter, publishedFilter, rows, search])

  const focusForm = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleStartCreate = () => {
    if (!createOnly) {
      navigateTo(ADMIN_CALENDAR_NEW_PATH)
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

  const handleStartEdit = (row: CalendarEventRow) => {
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
    const startAt = String(formData.get('start_at') || '')
    const endAt = String(formData.get('end_at') || '')

    if (!String(formData.get('title') || '').trim()) {
      setValidationError('Title is required.')
      return
    }

    if (!startAt) {
      setValidationError('Start date and time are required.')
      return
    }

    if (endAt && new Date(endAt).getTime() < new Date(startAt).getTime()) {
      setValidationError('End date and time must be later than the start date and time.')
      return
    }

    setSaving(true)

    const payload = {
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim() || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      location: String(formData.get('location') || '').trim() || null,
      category: String(formData.get('category') || '').trim() || null,
      published: formData.get('published') === 'on',
    }

    try {
      if (editing) {
        await updateEvent(editing.id, payload)
        setSaveMessage('Event updated.')
      } else {
        await createEvent(payload)
        setSaveMessage('Event created.')
      }

      await load()
      if (createOnly) {
        navigateTo(ADMIN_CALENDAR_PATH)
        return
      }

      setIsComposerOpen(false)
      setEditing(null)
      setFormVersion((value) => value + 1)
      event.currentTarget.reset()
    } catch (eventError) {
      setSaveError(eventError instanceof Error ? eventError.message : 'Unable to save calendar event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: CalendarEventRow) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return

    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    try {
      await deleteEvent(row.id)
      setRows((current) => current.filter((item) => item.id !== row.id))
      if (editing?.id === row.id) setEditing(null)
      setSaveMessage('Event deleted.')
    } catch (eventError) {
      setSaveError(eventError instanceof Error ? eventError.message : 'Unable to delete calendar event.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="registration section">
      <div className="container admin-shell">
        <div className="admin-header-row">
          <div>
            <h2>{createOnly ? 'Create event' : 'Calendar'}</h2>
            <p className="admin-copy">
              {createOnly ? 'Add a new event in a dedicated create screen.' : 'Manage public calendar events without changing the public page design.'}
            </p>
          </div>
          {!createOnly ? (
            <button className="button secondary admin-secondary" type="button" onClick={handleStartCreate}>
              <Plus size={18} />
              New event
            </button>
          ) : (
            <button className="button secondary admin-secondary" type="button" onClick={() => navigateTo(ADMIN_CALENDAR_PATH)}>
              Back to events
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
              placeholder="Search by event title or location"
            />
          </label>
          <label>
            <span>Visibility</span>
            <select value={publishedFilter} onChange={(event) => setPublishedFilter(event.target.value)}>
              <option value="all">All events</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
        </div>
        ) : null}

        {loading ? <p className="loading-note"><LoaderCircle size={18} /> Loading calendar events…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!loading && !error && !createOnly ? (
          <>
            <div className={`summary-card admin-results-card${editing ? ' admin-results-card-split' : ''}`}>
              <div className="admin-results-header">
                <h3>Events</h3>
                <span>{filteredRows.length}</span>
              </div>
              {filteredRows.length === 0 ? (
                <p className="admin-empty">No events match the current filters.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Location</th>
                        <th>Category</th>
                        <th>Published</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id} className={row.id === editing?.id ? 'active' : undefined}>
                          <td>{row.title}</td>
                          <td>{formatDateTime(row.start_at)}</td>
                          <td>{row.end_at ? formatDateTime(row.end_at) : '—'}</td>
                          <td>{row.location || '—'}</td>
                          <td>{row.category || '—'}</td>
                          <td>{row.published ? 'Published' : 'Unpublished'}</td>
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
                    <h3>{editing ? 'Edit event' : 'Create event'}</h3>
                    <p>{editing ? 'Update the selected calendar event.' : 'Add a new calendar event.'}</p>
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
                    <span>Category</span>
                    <input name="category" defaultValue={editing?.category || ''} />
                  </label>
                  <label>
                    <span>Start date and time</span>
                    <input name="start_at" type="datetime-local" defaultValue={toDateTimeLocal(editing?.start_at || null)} required />
                  </label>
                  <label>
                    <span>End date and time</span>
                    <input name="end_at" type="datetime-local" defaultValue={toDateTimeLocal(editing?.end_at || null)} />
                  </label>
                  <label>
                    <span>Location</span>
                    <input name="location" defaultValue={editing?.location || ''} />
                  </label>
                  <label className="toggle-row">
                    <input name="published" type="checkbox" defaultChecked={editing?.published || false} />
                    <span>Published</span>
                  </label>
                </div>

                <label className="full-width">
                  <span>Description</span>
                  <textarea name="description" rows={5} defaultValue={editing?.description || ''} />
                </label>

                <div className="form-actions admin-form-actions">
                  <button className="button primary" type="submit" disabled={saving}>
                    {saving ? <><LoaderCircle size={18} /> Saving…</> : 'Save event'}
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
                <h3>Create event</h3>
                <p>Add a new calendar event.</p>
              </div>
              <button className="button secondary admin-secondary" type="button" onClick={() => navigateTo(ADMIN_CALENDAR_PATH)}>
                Cancel
              </button>
            </div>

            <div className="field-grid">
              <label>
                <span>Title</span>
                <input name="title" defaultValue="" required />
              </label>
              <label>
                <span>Category</span>
                <input name="category" defaultValue="" />
              </label>
              <label>
                <span>Start date and time</span>
                <input name="start_at" type="datetime-local" defaultValue="" required />
              </label>
              <label>
                <span>End date and time</span>
                <input name="end_at" type="datetime-local" defaultValue="" />
              </label>
              <label>
                <span>Location</span>
                <input name="location" defaultValue="" />
              </label>
              <label className="toggle-row">
                <input name="published" type="checkbox" defaultChecked={false} />
                <span>Published</span>
              </label>
            </div>

            <label className="full-width">
              <span>Description</span>
              <textarea name="description" rows={5} defaultValue="" />
            </label>

            <div className="form-actions admin-form-actions">
              <button className="button primary" type="submit" disabled={saving}>
                {saving ? <><LoaderCircle size={18} /> Saving…</> : 'Save event'}
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

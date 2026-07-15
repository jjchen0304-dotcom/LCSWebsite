import { CheckCircle2, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createNewsPost,
  deleteNewsPost,
  getNewsPosts,
  updateNewsPost,
  uploadNewsImage,
  type NewsPostRow,
} from '../lib/supabase'
import { ADMIN_NEWS_NEW_PATH, ADMIN_NEWS_PATH, navigateTo } from '../lib/router'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function sortPosts(rows: NewsPostRow[]) {
  return [...rows].sort((left, right) => {
    if (left.featured !== right.featured) return left.featured ? -1 : 1
    const leftTime = new Date(left.published_at || left.created_at).getTime()
    const rightTime = new Date(right.published_at || right.created_at).getTime()
    return rightTime - leftTime
  })
}

export default function AdminNewsPage({
  createOnly = false,
}: {
  createOnly?: boolean
}) {
  const [rows, setRows] = useState<NewsPostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<NewsPostRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const nextRows = sortPosts(await getNewsPosts())
      setRows(nextRows)
      setEditing((current) => current ? nextRows.find((row) => row.id === current.id) ?? null : current)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load news posts.')
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

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedImage)
    setSelectedImagePreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedImage])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        [row.title, row.summary, row.body]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      if (statusFilter === 'published') return matchesSearch && row.published && !row.archived
      if (statusFilter === 'draft') return matchesSearch && !row.published && !row.archived
      if (statusFilter === 'archived') return matchesSearch && row.archived
      if (statusFilter === 'featured') return matchesSearch && row.featured && !row.archived

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
      navigateTo(ADMIN_NEWS_NEW_PATH)
      return
    }

    setIsComposerOpen(true)
    setEditing(null)
    setSelectedImage(null)
    setSaveMessage(null)
    setSaveError(null)
    setValidationError(null)
    setFormVersion((value) => value + 1)
    focusForm()
  }

  const handleStartEdit = (row: NewsPostRow) => {
    setIsComposerOpen(true)
    setEditing(row)
    setSelectedImage(null)
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

    if (!String(formData.get('title') || '').trim()) {
      setValidationError('Title is required.')
      return
    }

    if (!String(formData.get('summary') || '').trim()) {
      setValidationError('Summary is required.')
      return
    }

    if (!String(formData.get('body') || '').trim()) {
      setValidationError('Article body is required.')
      return
    }

    setSaving(true)

    const nextPublished = formData.get('published') === 'on'
    let imageUrl = String(formData.get('image_url') || '').trim() || null

    try {
      if (selectedImage) {
        imageUrl = await uploadNewsImage(selectedImage)
      }

      const payload = {
        title: String(formData.get('title') || '').trim(),
        summary: String(formData.get('summary') || '').trim(),
        body: String(formData.get('body') || '').trim(),
        image_url: imageUrl,
        external_link: String(formData.get('external_link') || '').trim() || null,
        featured: formData.get('featured') === 'on',
        published: nextPublished,
        archived: formData.get('archived') === 'on',
        published_at: nextPublished
          ? editing?.published_at || new Date().toISOString()
          : editing?.published_at || null,
      }

      if (editing) {
        await updateNewsPost(editing.id, payload)
        setSaveMessage('News article updated.')
      } else {
        await createNewsPost(payload)
        setSaveMessage('News article created.')
      }

      await load()
      if (createOnly) {
        navigateTo(ADMIN_NEWS_PATH)
        return
      }

      setIsComposerOpen(false)
      setEditing(null)
      setSelectedImage(null)
      setFormVersion((value) => value + 1)
      event.currentTarget.reset()
    } catch (newsError) {
      setSaveError(newsError instanceof Error ? newsError.message : 'Unable to save news article.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: NewsPostRow) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return

    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    try {
      await deleteNewsPost(row.id)
      setRows((current) => current.filter((item) => item.id !== row.id))
      if (editing?.id === row.id) setEditing(null)
      setSaveMessage('News article deleted.')
    } catch (newsError) {
      setSaveError(newsError instanceof Error ? newsError.message : 'Unable to delete news article.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="registration section">
      <div className="container admin-shell">
        <div className="admin-header-row">
          <div>
            <h2>{createOnly ? 'Create article' : 'News'}</h2>
            <p className="admin-copy">
              {createOnly ? 'Add a new article in a dedicated create screen.' : 'Manage article content for the homepage and the public news pages.'}
            </p>
          </div>
          {!createOnly ? (
            <button className="button secondary admin-secondary" type="button" onClick={handleStartCreate}>
              <Plus size={18} />
              New article
            </button>
          ) : (
            <button className="button secondary admin-secondary" type="button" onClick={() => navigateTo(ADMIN_NEWS_PATH)}>
              Back to articles
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
              placeholder="Search by title, summary, or article body"
            />
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All articles</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
              <option value="featured">Featured</option>
            </select>
          </label>
        </div>
        ) : null}

        {loading ? <p className="loading-note"><LoaderCircle size={18} /> Loading news articles…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!loading && !error && !createOnly ? (
          <>
            <div className={`summary-card admin-results-card${editing ? ' admin-results-card-split' : ''}`}>
              <div className="admin-results-header">
                <h3>Articles</h3>
                <span>{filteredRows.length}</span>
              </div>
              {filteredRows.length === 0 ? (
                <p className="admin-empty">No news articles match the current filters.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Featured</th>
                        <th>Visibility</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id} className={row.id === editing?.id ? 'active' : undefined}>
                          <td>{row.title}</td>
                          <td>{formatDate(row.published_at || row.created_at)}</td>
                          <td>{row.featured ? 'Featured' : 'Standard'}</td>
                          <td>{row.archived ? 'Archived' : row.published ? 'Published' : 'Draft'}</td>
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
                    <h3>{editing ? 'Edit article' : 'Create article'}</h3>
                    <p>{editing ? 'Update the selected article.' : 'Add a new news article.'}</p>
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
                    <span>Image URL</span>
                    <input name="image_url" defaultValue={editing?.image_url || ''} placeholder="https://..." />
                  </label>
                  <label>
                    <span>Upload image</span>
                    <input
                      name="image_file"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <label className="full-width">
                    <span>External link</span>
                    <input name="external_link" defaultValue={editing?.external_link || ''} placeholder="Optional article link" />
                  </label>
                  <label className="toggle-row">
                    <input name="featured" type="checkbox" defaultChecked={editing?.featured || false} />
                    <span>Featured article</span>
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

                {selectedImagePreview || editing?.image_url ? (
                  <div className="admin-image-preview">
                    <span>Preview</span>
                    <img
                      src={selectedImagePreview || editing?.image_url || ''}
                      alt={editing?.title || 'News image preview'}
                    />
                  </div>
                ) : null}

                <label className="full-width">
                  <span>Summary</span>
                  <textarea name="summary" rows={3} defaultValue={editing?.summary || ''} required />
                </label>

                <label className="full-width">
                  <span>Article body</span>
                  <textarea name="body" rows={10} defaultValue={editing?.body || ''} required />
                </label>

                <div className="form-actions admin-form-actions">
                  <button className="button primary" type="submit" disabled={saving}>
                    {saving ? <><LoaderCircle size={18} /> {selectedImage ? 'Uploading image…' : 'Saving…'}</> : 'Save article'}
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
                <h3>Create article</h3>
                <p>Add a new news article.</p>
              </div>
              <button className="button secondary admin-secondary" type="button" onClick={() => navigateTo(ADMIN_NEWS_PATH)}>
                Cancel
              </button>
            </div>

            <div className="field-grid">
              <label>
                <span>Title</span>
                <input name="title" defaultValue="" required />
              </label>
              <label>
                <span>Image URL</span>
                <input name="image_url" defaultValue="" placeholder="https://..." />
              </label>
              <label>
                <span>Upload image</span>
                <input
                  name="image_file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                />
              </label>
              <label className="full-width">
                <span>External link</span>
                <input name="external_link" defaultValue="" placeholder="Optional article link" />
              </label>
              <label className="toggle-row">
                <input name="featured" type="checkbox" defaultChecked={false} />
                <span>Featured article</span>
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

            {selectedImagePreview ? (
              <div className="admin-image-preview">
                <span>Preview</span>
                <img src={selectedImagePreview} alt="News image preview" />
              </div>
            ) : null}

            <label className="full-width">
              <span>Summary</span>
              <textarea name="summary" rows={3} defaultValue="" required />
            </label>

            <label className="full-width">
              <span>Article body</span>
              <textarea name="body" rows={10} defaultValue="" required />
            </label>

            <div className="form-actions admin-form-actions">
              <button className="button primary" type="submit" disabled={saving}>
                {saving ? <><LoaderCircle size={18} /> {selectedImage ? 'Uploading image…' : 'Saving…'}</> : 'Save article'}
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

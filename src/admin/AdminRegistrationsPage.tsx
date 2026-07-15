import { CheckCircle2, Download, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { getRegistrations, updateRegistration, type RegistrationRow } from '../lib/supabase'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function escapeCsv(value: string | number | boolean | null) {
  const text = value == null ? '' : String(value)
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text
  return `"${text.replaceAll('"', '""')}"`
}

function buildCsv(rows: RegistrationRow[]) {
  const headers = [
    'Registration Number',
    'Submitted At',
    'Parent Name',
    'Email',
    'Phone',
    'Address',
    'Student Name',
    'Chinese Name',
    'Age',
    'Grade',
    'Program',
    'Class Preference',
    'Notes',
    'Payment Method',
    'Early Bird',
    'Terms Accepted',
    'Registration Status',
    'Payment Status',
    'Admin Notes',
    'Created At',
    'Updated At',
  ]

  const lines = rows.map((row) => [
    row.registration_number,
    row.submitted_at,
    row.parent_name,
    row.email,
    row.phone,
    row.address,
    row.student_name,
    row.chinese_name,
    row.age,
    row.grade,
    row.program,
    row.class_preference,
    row.notes,
    row.payment_method,
    row.early_bird,
    row.terms_accepted,
    row.registration_status,
    row.payment_status,
    row.admin_notes,
    row.created_at,
    row.updated_at,
  ])

  return [headers, ...lines]
    .map((line) => line.map((value) => escapeCsv(value ?? null)).join(','))
    .join('\n')
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const registrationStatuses: RegistrationRow['registration_status'][] = [
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'archived',
]

const paymentStatuses: RegistrationRow['payment_status'][] = [
  'unpaid',
  'pending',
  'paid',
  'waived',
  'refunded',
]

export default function AdminRegistrationsPage() {
  const [rows, setRows] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [registrationFilter, setRegistrationFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const nextRows = await getRegistrations()
      setRows(nextRows)
      setSelectedId((current) => current ?? nextRows[0]?.id ?? null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load registrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        query.length === 0 ||
        [
          row.registration_number,
          row.parent_name,
          row.email,
          row.phone,
          row.student_name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      const matchesRegistration =
        registrationFilter === 'all' || row.registration_status === registrationFilter

      const matchesPayment =
        paymentFilter === 'all' || row.payment_status === paymentFilter

      return matchesSearch && matchesRegistration && matchesPayment
    })
  }, [paymentFilter, registrationFilter, rows, search])

  useEffect(() => {
    if (!filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id ?? null)
    }
  }, [filteredRows, selectedId])

  const selected = filteredRows.find((row) => row.id === selectedId) ?? null

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected) return

    const formData = new FormData(event.currentTarget)
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    const patch = {
      registration_status: String(formData.get('registration_status')) as RegistrationRow['registration_status'],
      payment_status: String(formData.get('payment_status')) as RegistrationRow['payment_status'],
      admin_notes: String(formData.get('admin_notes') || '').trim() || null,
    }

    try {
      await updateRegistration(selected.id, patch)
      setRows((current) =>
        current.map((row) => (row.id === selected.id ? { ...row, ...patch } : row)),
      )
      setSaveMessage('Registration updated.')
    } catch (updateError) {
      setSaveError(updateError instanceof Error ? updateError.message : 'Unable to update registration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="registration section">
      <div className="container admin-shell">
        <div className="admin-header-row">
          <div>
            <p className="eyebrow red">Admin</p>
            <h2>Registrations</h2>
            <p className="admin-copy">Search, review, and update submitted registrations.</p>
          </div>
          <button
            className="button secondary admin-secondary"
            type="button"
            onClick={() => downloadCsv(`registrations-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(filteredRows))}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="form-card admin-toolbar">
          <label className="admin-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by registration number, parent, student, email, or phone"
            />
          </label>
          <label>
            <span>Registration status</span>
            <select value={registrationFilter} onChange={(event) => setRegistrationFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {registrationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>
            <span>Payment status</span>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="all">All payment statuses</option>
              {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </div>

        {loading ? <p className="loading-note"><LoaderCircle size={18} /> Loading registrations…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="admin-grid admin-grid-wide">
            <div className="summary-card admin-results-card">
              <div className="admin-results-header">
                <h3>Visible registrations</h3>
                <span>{filteredRows.length}</span>
              </div>
              {filteredRows.length === 0 ? (
                <p className="admin-empty">No registrations match the current filters.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Registration #</th>
                        <th>Submitted</th>
                        <th>Parent</th>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Program</th>
                        <th>Class Preference</th>
                        <th>Payment Method</th>
                        <th>Payment Status</th>
                        <th>Registration Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr
                          key={row.id}
                          className={row.id === selectedId ? 'active' : undefined}
                          onClick={() => setSelectedId(row.id)}
                        >
                          <td>{row.registration_number || `Registration ${row.id}`}</td>
                          <td>{formatDateTime(row.submitted_at)}</td>
                          <td>{row.parent_name}</td>
                          <td>{row.student_name}</td>
                          <td>{row.email}</td>
                          <td>{row.phone}</td>
                          <td>{row.program}</td>
                          <td>{row.class_preference}</td>
                          <td>{row.payment_method}</td>
                          <td>{row.payment_status}</td>
                          <td>{row.registration_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selected ? (
              <form className="form-card admin-detail-card" onSubmit={handleSave}>
                <div className="admin-detail-header">
                  <div>
                    <h3>{selected.registration_number || `Registration ${selected.id}`}</h3>
                    <p>{formatDateTime(selected.submitted_at)}</p>
                  </div>
                </div>

                <div className="admin-detail-grid">
                  <div><strong>Parent name</strong><span>{selected.parent_name}</span></div>
                  <div><strong>Email</strong><span>{selected.email}</span></div>
                  <div><strong>Phone</strong><span>{selected.phone}</span></div>
                  <div><strong>Address</strong><span>{selected.address}</span></div>
                  <div><strong>Student name</strong><span>{selected.student_name}</span></div>
                  <div><strong>Chinese name</strong><span>{selected.chinese_name || '—'}</span></div>
                  <div><strong>Age</strong><span>{selected.age}</span></div>
                  <div><strong>Grade</strong><span>{selected.grade}</span></div>
                  <div><strong>Program</strong><span>{selected.program}</span></div>
                  <div><strong>Class preference</strong><span>{selected.class_preference}</span></div>
                  <div><strong>Payment method</strong><span>{selected.payment_method}</span></div>
                  <div><strong>Early bird</strong><span>{selected.early_bird ? 'Yes' : 'No'}</span></div>
                  <div><strong>Terms accepted</strong><span>{selected.terms_accepted ? 'Yes' : 'No'}</span></div>
                  <div><strong>Notes</strong><span>{selected.notes || '—'}</span></div>
                  <div><strong>Created at</strong><span>{formatDateTime(selected.created_at)}</span></div>
                  <div><strong>Updated at</strong><span>{formatDateTime(selected.updated_at)}</span></div>
                </div>

                <div className="field-grid">
                  <label>
                    <span>Registration status</span>
                    <select name="registration_status" defaultValue={selected.registration_status}>
                      {registrationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Payment status</span>
                    <select name="payment_status" defaultValue={selected.payment_status}>
                      {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                </div>

                <label className="full-width">
                  <span>Admin notes</span>
                  <textarea name="admin_notes" rows={6} defaultValue={selected.admin_notes || ''} />
                </label>

                <div className="form-actions admin-form-actions">
                  <button className="button primary" type="submit" disabled={saving}>
                    {saving ? <><LoaderCircle size={18} /> Saving…</> : 'Save changes'}
                  </button>
                </div>
                {saveMessage ? <p className="form-success"><CheckCircle2 size={18} /> {saveMessage}</p> : null}
                {saveError ? <p className="form-error">{saveError}</p> : null}
              </form>
            ) : (
              <div className="form-card admin-detail-card">
                <p className="admin-empty">Select a registration to view its full details.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

import { ArrowRight, Lock, LoaderCircle } from 'lucide-react'
import { type FormEvent } from 'react'
import { HOME_PATH, SmartLink } from '../lib/router'

export default function AdminLoginPage({
  error,
  loading,
  onSubmit,
}: {
  error: string | null
  loading: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="registration section">
      <div className="container admin-shell">
        <div className="form-card admin-card">
          <SmartLink className="text-link back-link" href={HOME_PATH}>
            <ArrowRight size={17} /> Back to website
          </SmartLink>
          <p className="eyebrow red">Admin</p>
          <h2>Sign in</h2>
          <p className="admin-copy">Use the single admin account to manage registrations and calendar events.</p>
          <form className="registration-form" autoComplete="off" onSubmit={onSubmit}>
            <label>
              <span>Email</span>
              <input name="email" type="email" defaultValue="admin@gmail.com" autoComplete="username" required />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" defaultValue="" autoComplete="off" required />
            </label>
            <div className="form-actions admin-form-actions">
              <button className="button primary" type="submit" disabled={loading}>
                {loading ? <><LoaderCircle size={18} /> Signing in…</> : <><Lock size={18} /> Sign in</>}
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        </div>
      </div>
    </section>
  )
}

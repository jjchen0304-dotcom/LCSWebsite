import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchPublicNewsPosts, type NewsPostRow } from '../lib/supabase'
import { HOME_PATH, SmartLink } from '../lib/router'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function NewsImage({ post }: { post: NewsPostRow }) {
  if (post.image_url) {
    return <img className="news-card-image" src={post.image_url} alt={post.title} />
  }

  return <div className="news-card-image news-card-image-fallback" aria-hidden="true" />
}

export default function NewsPage() {
  const [rows, setRows] = useState<NewsPostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchPublicNewsPosts()
        if (!cancelled) setRows(data)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load news.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="subhero news-hero">
        <div className="container subhero-inner">
          <div>
            <p className="eyebrow red">News</p>
            <h1>School stories and updates</h1>
          </div>
          <SmartLink className="text-link back-link" href={HOME_PATH}><ArrowRight size={17} /> Back home</SmartLink>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading row">
            <div>
              <p className="eyebrow gold">Latest news</p>
              <h2>News from Lexington Chinese School</h2>
            </div>
          </div>
          {loading ? <p className="loading-note">Loading news…</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!loading && !error ? (
            rows.length > 0 ? (
              <div className="news-grid">
                {rows.map((post) => (
                  <article className="news-card" key={post.id}>
                    <NewsImage post={post} />
                    <div className="news-card-body">
                      <p className="news-date">{formatDate(post.published_at || post.created_at)}</p>
                      <h3>{post.title}</h3>
                      <p>{post.summary}</p>
                      <SmartLink className="text-link" href={`/news/${post.id}`}>
                        Read more <ArrowRight size={16} />
                      </SmartLink>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-empty">No published news articles are available yet.</p>
            )
          ) : null}
        </div>
      </section>
    </>
  )
}

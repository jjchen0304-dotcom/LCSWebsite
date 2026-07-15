import { ArrowRight } from 'lucide-react'
import { NEWS_PATH, SmartLink } from '../lib/router'
import type { NewsPostRow } from '../lib/supabase'

function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default function NewsPreview({
  posts,
  loading,
  error,
}: {
  posts: NewsPostRow[]
  loading: boolean
  error: string | null
}) {
  return (
    <section className="section news-preview-section">
      <div className="container">
        <div className="section-heading row">
          <div>
            <p className="eyebrow red">News</p>
            <h2>Stories from the school community</h2>
          </div>
          <SmartLink className="text-link" href={NEWS_PATH}>View All News <ArrowRight size={17} /></SmartLink>
        </div>

        {loading ? <p className="loading-note">Loading news…</p> : null}
        {error ? <p className="form-error">News is temporarily unavailable.</p> : null}

        {!loading && !error ? (
          posts.length > 0 ? (
            <div className="news-grid">
              {posts.map((post) => (
                <article className="news-card" key={post.id}>
                  {post.image_url ? <img className="news-card-image" src={post.image_url} alt={post.title} /> : <div className="news-card-image news-card-image-fallback" aria-hidden="true" />}
                  <div className="news-card-body">
                    <p className="news-date">{formatNewsDate(post.published_at || post.created_at)}</p>
                    <h3>{post.title}</h3>
                    <p>{post.summary}</p>
                    <SmartLink className="text-link" href={`/news/${post.id}`}>
                      Read More <ArrowRight size={16} />
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
  )
}

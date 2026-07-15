import { ArrowRight } from 'lucide-react'
import { NEWS_PATH, SmartLink } from '../lib/router'
import type { NewsPostRow } from '../lib/supabase'

const fallbackPosts = [
  {
    id: 'preview-1',
    title: 'Fall enrollment and class placement information',
    date: 'August 18, 2026',
    summary: 'Families will receive placement updates, arrival reminders, and first-day classroom details before the semester begins.',
  },
  {
    id: 'preview-2',
    title: 'Community celebration highlights from the spring term',
    date: 'May 26, 2026',
    summary: 'Students shared language projects, performances, and cultural activities during an end-of-term afternoon with families.',
  },
  {
    id: 'preview-3',
    title: 'Volunteer opportunities for school events and classroom support',
    date: 'April 10, 2026',
    summary: 'Parents and community members can help with check-in, celebrations, classroom activities, and special event coordination.',
  },
] as const

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
  const showFallback = (!loading && Boolean(error)) || (!loading && posts.length === 0)

  return (
    <section id="news" className="section news-preview-section">
      <div className="container">
        <div className="section-heading centered">
          <div>
            <p className="eyebrow red">News</p>
            <h2>Stories from the LCS community</h2>
          </div>
          <SmartLink className="text-link section-heading-link" href={NEWS_PATH}>View All News <ArrowRight size={17} /></SmartLink>
        </div>

        {loading ? <p className="loading-note">Loading news…</p> : null}

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
          ) : null
        ) : null}

        {showFallback ? (
          <>
            <p className="preview-note">Preview stories are shown here until published news is connected.</p>
            <div className="news-grid">
              {fallbackPosts.map((post) => (
                <article className="news-card" key={post.id}>
                  <div className="news-card-image news-card-image-fallback" aria-hidden="true" />
                  <div className="news-card-body">
                    <p className="news-date">{post.date}</p>
                    <h3>{post.title}</h3>
                    <p>{post.summary}</p>
                    <span className="text-link news-preview-placeholder-link">
                      Story preview <ArrowRight size={16} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}

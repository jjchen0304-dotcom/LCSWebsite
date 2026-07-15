import { ArrowRight, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPublicNewsPost, type NewsPostRow } from '../lib/supabase'
import { HOME_PATH, NEWS_PATH, SmartLink } from '../lib/router'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function renderBody(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export default function NewsDetailPage({ postId }: { postId: number }) {
  const [post, setPost] = useState<NewsPostRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getPublicNewsPost(postId)
        if (!cancelled) setPost(data)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load this article.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [postId])

  return (
    <>
      <section className="subhero news-hero">
        <div className="container subhero-inner">
          <div>
            <p className="eyebrow red">News</p>
            <h1>{loading ? 'Loading article…' : post?.title ?? 'Article not found'}</h1>
          </div>
          <div className="hero-actions">
            <SmartLink className="button secondary admin-secondary" href={NEWS_PATH}>All news</SmartLink>
            <SmartLink className="text-link back-link" href={HOME_PATH}><ArrowRight size={17} /> Back home</SmartLink>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container news-article-shell">
          {loading ? <p className="loading-note">Loading article…</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          {!loading && !error ? (
            post ? (
              <article className="news-article">
                <p className="news-date">{formatDate(post.published_at || post.created_at)}</p>
                {post.image_url ? <img className="news-article-image" src={post.image_url} alt={post.title} /> : null}
                <div className="news-article-body">
                  <p className="news-summary">{post.summary}</p>
                  {renderBody(post.body).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {post.external_link ? (
                  <a className="text-link" href={post.external_link} target="_blank" rel="noreferrer">
                    Open related link <ExternalLink size={16} />
                  </a>
                ) : null}
              </article>
            ) : (
              <p className="admin-empty">This article is not available.</p>
            )
          ) : null}
        </div>
      </section>
    </>
  )
}

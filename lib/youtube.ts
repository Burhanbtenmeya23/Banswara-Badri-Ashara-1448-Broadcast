export function extractVideoId(url: string): string | null {
  return extractYouTubeVideoId(url)
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    // youtube.com/live/ID
    if (u.pathname.startsWith('/live/')) return u.pathname.split('/live/')[1].split('?')[0]
    // youtube.com/watch?v=ID
    const v = u.searchParams.get('v')
    if (v) return v
    // youtube.com/embed/ID or youtube-nocookie.com/embed/ID
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1].split('?')[0]
    return null
  } catch {
    return null
  }
}

export function getYouTubeEmbedUrl(url: string): string {
  const id = extractYouTubeVideoId(url)
  if (!id) return ''
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`
}

// Keep backward compat
export function toEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
}

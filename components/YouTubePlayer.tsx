'use client'

import { useEffect, useRef, useState, useCallback, useId } from 'react'
import Script from 'next/script'
import { extractYouTubeVideoId } from '@/lib/youtube'

// Minimal YT types — avoids needing @types/youtube
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId?: string
          host?: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
            onError?: (e: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { PAUSED: number; PLAYING: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
  interface YTPlayer {
    playVideo(): void
    pauseVideo(): void
    destroy(): void
    getPlayerState(): number
  }
}

const BLOCKED_KEYS = new Set([
  'Space', 'KeyK', 'KeyJ', 'KeyL',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End',
])

const POSITIONS: React.CSSProperties[] = [
  { top: '10px', left: '10px' },
  { top: '10px', right: '10px' },
  { bottom: '50px', left: '10px' },
  { bottom: '50px', right: '10px' },
]

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

interface Props {
  url: string
  itsId?: string
}

// ─── iOS player ─────────────────────────────────────────────────────────────
// On iOS Safari, the IFrame API's postMessage-based playVideo() is not treated
// as a user gesture, so autoplay is always blocked regardless of our tap overlay.
// Direct iframe embed lets iOS show its native play button which DOES count as
// a gesture — the video plays inline without hijacking to fullscreen.
function IOSPlayer({ videoId, itsId }: { videoId: string; itsId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [posIdx, setPosIdx] = useState(0)

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&controls=1&rel=0&iv_load_policy=3&cc_load_policy=0&modestbranding=1&fs=0`

  useEffect(() => {
    const t = setTimeout(function tick() {
      setPosIdx(p => (p + 1) % POSITIONS.length)
      setTimeout(tick, 30000 + Math.random() * 30000)
    }, 30000 + Math.random() * 30000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function onChange() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = document as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elem = el as any
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement
    if (isFs) {
      ;(doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc)
    } else {
      ;(elem.requestFullscreen || elem.webkitRequestFullscreen)?.call(elem)
    }
  }

  const wPos = POSITIONS[posIdx]

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl"
      style={{ WebkitUserSelect: 'none' } as React.CSSProperties}>
      <div className="bg-black" style={{ position: 'relative', paddingTop: '56.25%' }}>
        <iframe
          src={src}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      {/* Watermark */}
      {itsId && (
        <div className="absolute z-20 pointer-events-none transition-all duration-[1200ms] ease-in-out"
          style={{
            ...wPos,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(3px)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            letterSpacing: '0.06em',
            userSelect: 'none',
          }}>
          ITS: {itsId}
        </div>
      )}

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute z-20 opacity-100"
        style={{
          bottom: '10px', right: '10px',
          background: 'rgba(0,0,0,0.65)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '6px', padding: '7px',
          cursor: 'pointer', color: 'white',
        }}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ─── Full API player (desktop / Android) ────────────────────────────────────
function APIPlayer({ videoId, itsId }: { videoId: string; itsId?: string }) {
  const uid = useId().replace(/:/g, '')
  const divId = `yt-${uid}`
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [apiReady, setApiReady] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [playerError, setPlayerError] = useState(false)
  const [posIdx, setPosIdx] = useState(0)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const initPlayer = useCallback(() => {
    if (!window.YT?.Player || !videoId) return
    playerRef.current?.destroy()
    setPlayerError(false)
    playerRef.current = new window.YT.Player(divId, {
      videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        fs: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady(e) {
          setPlayerReady(true)
          e.target.playVideo()
        },
        onStateChange(e) {
          if (e.data === window.YT.PlayerState.PAUSED) {
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
            resumeTimerRef.current = setTimeout(() => {
              playerRef.current?.playVideo()
            }, 250)
          }
        },
        onError() {
          setPlayerError(true)
        },
      },
    })
  }, [videoId, divId])

  useEffect(() => {
    if (apiReady) initPlayer()
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [apiReady, initPlayer])

  useEffect(() => () => { playerRef.current?.destroy() }, [])

  useEffect(() => {
    const t = setTimeout(function tick() {
      setPosIdx(p => (p + 1) % POSITIONS.length)
      setTimeout(tick, 30000 + Math.random() * 30000)
    }, 30000 + Math.random() * 30000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>
    function onReturn() {
      setShowWelcomeBack(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setShowWelcomeBack(false), 4000)
      playerRef.current?.playVideo()
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') onReturn()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onReturn)
    return () => {
      clearTimeout(hideTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onReturn)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (BLOCKED_KEYS.has(e.code)) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => {
    function onChange() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = document as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elem = el as any
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement
    if (isFs) {
      ;(doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc)
    } else {
      ;(elem.requestFullscreen || elem.webkitRequestFullscreen)?.call(elem)
    }
  }

  function blockContext(e: React.MouseEvent) { e.preventDefault() }

  const wPos = POSITIONS[posIdx]

  return (
    <>
      <style>{`#${divId}, #${divId} iframe { position:absolute !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important; }`}</style>

      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.YT?.Player) {
            setApiReady(true)
          } else {
            const prev = window.onYouTubeIframeAPIReady
            window.onYouTubeIframeAPIReady = () => { prev?.(); setApiReady(true) }
          }
        }}
      />

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl select-none"
        style={{ WebkitUserSelect: 'none', MozUserSelect: 'none' } as React.CSSProperties}
        onContextMenu={blockContext}
        onDragStart={e => e.preventDefault()}
      >
        <div className="bg-black" style={{ position: 'relative', paddingTop: '56.25%' }}>
          <div id={divId} />
        </div>

        {/* Interaction blocker */}
        <div className="absolute inset-0 z-10 touch-none" onContextMenu={blockContext} onDragStart={e => e.preventDefault()} />

        {/* Watermark */}
        {itsId && (
          <div className="absolute z-20 pointer-events-none transition-all duration-[1200ms] ease-in-out"
            style={{
              ...wPos,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(3px)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'monospace',
              letterSpacing: '0.06em',
              userSelect: 'none',
            }}>
            ITS: {itsId}
          </div>
        )}

        {/* Fullscreen button */}
        {playerReady && !playerError && (
          <button
            onClick={toggleFullscreen}
            className="absolute z-20 transition-opacity duration-200 opacity-0 hover:opacity-100 focus:opacity-100"
            style={{
              bottom: '10px', right: '10px',
              background: 'rgba(0,0,0,0.65)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px', padding: '7px',
              cursor: 'pointer', color: 'white',
            }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
              </svg>
            )}
          </button>
        )}

        {/* Welcome back toast */}
        <div
          className="absolute z-30 top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-500 pointer-events-none whitespace-nowrap"
          style={{
            background: 'rgba(0,16,64,0.9)',
            border: '1px solid rgba(201,147,10,0.35)',
            color: '#c9930a',
            backdropFilter: 'blur(8px)',
            opacity: showWelcomeBack ? 1 : 0,
            transform: `translateX(-50%) translateY(${showWelcomeBack ? '0' : '-8px'})`,
          }}
        >
          Welcome back to the broadcast.
        </div>

        {/* Error overlay */}
        {playerError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,16,64,0.92)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-1">Stream unavailable</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Please refresh or contact the administrator.</p>
            <button onClick={() => initPlayer()}
              className="text-xs px-4 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {!playerReady && !playerError && (
          <div className="absolute inset-0 z-40 flex items-center justify-center"
            style={{ background: 'rgba(0,16,64,0.92)' }}>
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(201,147,10,0.3)', borderTopColor: '#c9930a' }} />
          </div>
        )}
      </div>
    </>
  )
}

// ─── Public export — picks the right player at runtime ───────────────────────
export default function YouTubePlayer({ url, itsId }: Props) {
  const videoId = extractYouTubeVideoId(url) ?? ''
  if (!videoId) return null
  if (isIOS()) return <IOSPlayer videoId={videoId} itsId={itsId} />
  return <APIPlayer videoId={videoId} itsId={itsId} />
}

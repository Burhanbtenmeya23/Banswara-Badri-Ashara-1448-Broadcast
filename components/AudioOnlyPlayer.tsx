'use client'

import { useEffect, useRef, useCallback, useId } from 'react'
import Script from 'next/script'
import { extractYouTubeVideoId } from '@/lib/youtube'


interface Props {
  url: string
}

export default function AudioOnlyPlayer({ url }: Props) {
  const uid = useId().replace(/:/g, '')
  const divId = `yt-audio-${uid}`
  const playerRef = useRef<YTPlayer | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoId = extractYouTubeVideoId(url) ?? ''

  const initPlayer = useCallback(() => {
    if (!window.YT?.Player || !videoId) return
    playerRef.current?.destroy()
    playerRef.current = new window.YT.Player(divId, {
      videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        rel: 0,
        playsinline: 1,
        fs: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady(e) { e.target.playVideo() },
        onStateChange(e) {
          if (e.data === window.YT.PlayerState.PAUSED) {
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
            resumeTimerRef.current = setTimeout(() => playerRef.current?.playVideo(), 250)
          }
        },
      },
    })
  }, [videoId, divId])

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer() }
    }
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      playerRef.current?.destroy()
    }
  }, [initPlayer])

  // Resume on tab return
  useEffect(() => {
    function onReturn() { playerRef.current?.playVideo() }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onReturn()
    })
    window.addEventListener('focus', onReturn)
    return () => {
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('focus', onReturn)
    }
  }, [])

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />

      {/* Hidden iframe — audio plays, video is not visible */}
      <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div id={divId} />
      </div>

      {/* Audio-only UI */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="glass-card p-10 text-center max-w-sm w-full">
          {/* Animated waveform */}
          <div className="flex items-end justify-center gap-1 mb-6" style={{ height: 48 }}>
            {[0.4, 0.7, 1, 0.85, 0.6, 0.9, 0.5, 0.75, 0.95, 0.65, 0.45, 0.8].map((h, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 4,
                  height: `${h * 100}%`,
                  background: '#003087',
                  opacity: 0.7,
                  animation: `audioBar 1.2s ease-in-out ${(i * 0.1).toFixed(1)}s infinite alternate`,
                }}
              />
            ))}
          </div>

          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(0,48,135,0.08)', border: '1px solid rgba(0,48,135,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>

          <h2 className="font-semibold text-lg mb-1" style={{ color: '#001a54' }}>Audio Broadcast</h2>
          <p className="text-sm" style={{ color: 'rgba(0,26,84,0.5)' }}>
            You are listening to the live broadcast.
          </p>
          <p className="text-xs mt-3" style={{ color: 'rgba(0,26,84,0.35)' }}>
            Video is not available for your account.
          </p>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            <span className="text-xs font-medium" style={{ color: '#dc2626' }}>LIVE</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes audioBar {
          from { transform: scaleY(0.3); opacity: 0.4; }
          to   { transform: scaleY(1);   opacity: 0.85; }
        }
      `}</style>
    </>
  )
}

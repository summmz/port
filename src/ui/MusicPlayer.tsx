import React, { useRef, useState } from 'react'
import type { MusicPlayerState, Track } from '../lib/useBackgroundMusic'

interface MusicPlayerProps {
  player: MusicPlayerState
  onClose?: () => void
  isModal?: boolean
  compact?: boolean
}

function fmt(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export function MusicPlayer({ player, onClose, isModal = false, compact = false }: MusicPlayerProps) {
  const {
    playlist,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    isRepeat,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = player

  const [isDragging, setIsDragging] = useState(false)
  const [mobileTab, setMobileTab] = useState<'player' | 'queue'>('player')
  const progressTrackRef = useRef<HTMLDivElement>(null)

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const handleSeekFromEvent = (clientX: number) => {
    if (!progressTrackRef.current) return
    const rect = progressTrackRef.current.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    seek(pct * duration)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    handleSeekFromEvent(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleSeekFromEvent(e.clientX)
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative z-30 w-full rounded-[22px] border border-accent/40 bg-gradient-to-br from-[#0c1322]/95 to-[#050811]/98 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(0,229,255,0.25),0_0_40px_rgba(0,136,255,0.25)] select-none text-white max-h-[88dvh] overflow-y-auto blade-scroll ${
        compact ? 'p-3.5 sm:p-5 max-w-full' : 'max-w-3xl p-4 sm:p-7'
      } ${isModal ? 'zoom-fade-in-anim' : ''}`}
    >
      {/* Top HUD Frame Details */}
      <div className="flex items-center justify-between border-b border-accent/20 pb-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 font-mono text-[0.65rem] sm:text-[0.68rem] text-cyan tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_#00e5ff] animate-pulse" />
          <span className="truncate">AUDIO CORE // BGM</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[0.625rem] sm:text-[0.65rem] text-white/50 tracking-wider hidden sm:inline">
            {volume <= 0.25 ? '[AMBIENT]' : '[DIRECT]'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-accent/40 border border-white/20 text-white/70 hover:text-white flex items-center justify-center font-mono text-xs transition-colors active:scale-90"
              title="Close Player"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on mobile when not compact) */}
      {!compact && (
        <div className="flex md:hidden items-center justify-center gap-1 bg-black/40 border border-white/10 rounded-full p-1 mb-4">
          <button
            onClick={() => setMobileTab('player')}
            className={`flex-1 py-1.5 rounded-full font-mono text-[0.68rem] font-bold tracking-wider uppercase transition-all ${
              mobileTab === 'player'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(0,136,255,0.6)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            ♫ NOW PLAYING
          </button>
          <button
            onClick={() => setMobileTab('queue')}
            className={`flex-1 py-1.5 rounded-full font-mono text-[0.68rem] font-bold tracking-wider uppercase transition-all ${
              mobileTab === 'queue'
                ? 'bg-accent text-white shadow-[0_0_12px_rgba(0,136,255,0.6)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            ☰ QUEUE ({playlist.length})
          </button>
        </div>
      )}

      {/* Main Grid matching Nazia-99/Music-Player-UI layout */}
      <div className={compact ? 'flex flex-col gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8'}>
        {/* ========================================================================= */}
        {/* LEFT COLUMN: NOW PLAYING                                                  */}
        {/* ========================================================================= */}
        <div className={`flex flex-col justify-between ${!compact && mobileTab === 'queue' ? 'hidden md:flex' : 'flex'}`}>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-mono text-[0.72rem] text-cyan/70 tracking-widest uppercase">
                NOW PLAYING
              </span>
              <span className="font-mono text-[0.72rem] text-white/50">
                TRACK {currentIndex + 1} OF {playlist.length}
              </span>
            </div>

            {/* Track Title */}
            <h2 className="font-mono font-bold text-2xl sm:text-3xl text-white tracking-wide mt-1 mb-1 truncate drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]">
              {currentTrack.title}
            </h2>

            {/* Artist */}
            <p className="font-sans text-sm sm:text-base font-semibold text-cyan/90 tracking-wide mb-0.5 truncate">
              {currentTrack.artist}
            </p>

            {/* Album */}
            <p className="font-mono text-xs text-white/40 tracking-wider mb-5">
              from <span className="italic text-white/60">{currentTrack.album}</span>, {currentTrack.year}
            </p>

            {/* Progress Bar */}
            <div className="mb-5">
              <div
                ref={progressTrackRef}
                onPointerDown={handlePointerDown}
                role="slider"
                aria-label="Seek track"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPct)}
                tabIndex={0}
                style={{ touchAction: 'none' }}
                className="relative h-3 rounded-full bg-white/10 border border-white/10 cursor-pointer overflow-visible group flex items-center"
              >
                {/* Glow fill */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-accent to-cyan shadow-[0_0_10px_rgba(0,229,255,0.7)]"
                  style={{ width: `${progressPct}%` }}
                />
                {/* Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan shadow-[0_0_10px_#00e5ff] transition-transform group-hover:scale-125"
                  style={{ left: `${progressPct}%` }}
                />
              </div>

              {/* Timestamp Row */}
              <div className="flex justify-between font-mono text-[0.68rem] text-white/50 mt-2">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-5 w-full">
              {/* Shuffle Button */}
              <button
                onClick={toggleShuffle}
                aria-pressed={isShuffle}
                aria-label="Shuffle"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isShuffle
                    ? 'text-cyan bg-cyan/20 border border-cyan shadow-[0_0_12px_rgba(0,229,255,0.5)]'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
                title="Shuffle Playlist"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
              </button>

              {/* Prev Button */}
              <button
                onClick={prevTrack}
                aria-label="Previous track"
                className="w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-cyan hover:bg-white/10 transition-colors active:scale-90"
                title="Previous Track"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M6 5h2v14H6zM20 5v14L9 12z" />
                </svg>
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent to-cyan text-void flex items-center justify-center cursor-pointer shadow-[0_0_24px_rgba(0,229,255,0.6)] hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={nextTrack}
                aria-label="Next track"
                className="w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-cyan hover:bg-white/10 transition-colors active:scale-90"
                title="Next Track"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18 5h-2v14h2zM4 5v14l11-7z" />
                </svg>
              </button>

              {/* Repeat Button */}
              <button
                onClick={toggleRepeat}
                aria-pressed={isRepeat}
                aria-label="Repeat"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isRepeat
                    ? 'text-cyan bg-cyan/20 border border-cyan shadow-[0_0_12px_rgba(0,229,255,0.5)]'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
                title="Repeat Track"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Volume Slider Row */}
          <div className="flex items-center gap-3 pt-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-cyan/70 flex-shrink-0">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {volume > 0.01 && <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
              {volume > 0.5 && <path d="M19 5a9 9 0 0 1 0 14" />}
            </svg>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-label="Volume"
                className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none bg-white/10 accent-cyan"
                style={{
                  background: `linear-gradient(to right, #00e5ff 0%, #0088ff ${Math.round(
                    volume * 100,
                  )}%, rgba(255,255,255,0.12) ${Math.round(volume * 100)}%, rgba(255,255,255,0.12) 100%)`,
                }}
              />
            </div>
            <span className="font-mono text-[0.65rem] text-cyan tracking-wider w-9 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: QUEUE LIST (UP NEXT)                                        */}
        {/* ========================================================================= */}
        <div className={`border-t md:border-t-0 md:border-l border-accent/25 md:pl-6 pt-4 md:pt-0 flex flex-col justify-between ${!compact && mobileTab === 'player' ? 'hidden md:flex' : 'flex'}`}>
          <div>
            <div className="font-mono text-[0.72rem] text-cyan/70 tracking-widest uppercase mb-3 flex items-center justify-between">
              <span>UP NEXT // TRANSMISSION QUEUE</span>
              <span className="text-[0.625rem] text-white/40">6 TRACKS</span>
            </div>

            <ul className="flex flex-col gap-1.5 max-h-64 sm:max-h-72 overflow-y-auto pr-1 scrollbar-none">
              {playlist.map((track: Track, idx: number) => {
                const isActive = idx === currentIndex
                return (
                  <li
                    key={track.id}
                    onClick={() => playTrack(idx)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? 'bg-accent/20 border-cyan/60 shadow-[0_0_16px_rgba(0,136,255,0.3)]'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Index / Animated Equalizer */}
                      <div className="w-5 flex items-center justify-center flex-shrink-0 font-mono text-xs text-white/40">
                        {isActive && isPlaying ? (
                          <div className="flex items-end gap-[2px] h-3.5">
                            <span className="w-[3px] bg-cyan rounded-full animate-bounce [animation-delay:0s] h-2.5" />
                            <span className="w-[3px] bg-cyan rounded-full animate-bounce [animation-delay:0.18s] h-3.5" />
                            <span className="w-[3px] bg-cyan rounded-full animate-bounce [animation-delay:0.35s] h-2" />
                          </div>
                        ) : (
                          <span className={isActive ? 'text-cyan font-bold' : ''}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      {/* Song info */}
                      <div className="truncate">
                        <div
                          className={`font-mono text-xs sm:text-sm font-semibold truncate transition-colors ${
                            isActive ? 'text-cyan' : 'text-white group-hover:text-cyan'
                          }`}
                        >
                          {track.title}
                        </div>
                        <div className="font-sans text-[0.7rem] text-white/50 truncate">
                          {track.artist}
                        </div>
                      </div>
                    </div>

                    {/* Est. duration badge */}
                    <div className="font-mono text-[0.65rem] text-white/40 ml-2 flex-shrink-0">
                      {fmt(track.estimatedDuration ?? 190)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-accent/20 flex items-center justify-between font-mono text-[0.625rem] text-white/40">
            <span>BITRATE: 320 KBPS AAC/MP3</span>
            <span className="text-cyan">ELEVATOR AUDIO MATRIX</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { hubCards, identity, notes, projects, type CardType, type SectionId } from '../content'
import type { GpuReport, PerfState } from '../lib/usePerf'
import { useBackgroundMusic } from '../lib/useBackgroundMusic'
import { MusicPlayer } from './MusicPlayer'
import { swipeLockRef } from '../lib/swipeLock'

interface HudProps {
  section: SectionId
  onNavigate: (id: SectionId) => void
  /** Browse-only: move the camera to a section without opening the blade. */
  onBrowse: (id: SectionId) => void
  gpu: GpuReport
  webgpu: 'available' | 'unavailable' | 'unknown'
  perf: PerfState
  selected: string | null
  onSelect: (id: CardType | null) => void
  onToggleQuality: () => void
}

/** Lightweight Cybernetic Audio Synthesizer */
function useCyberAudio() {
  const [enabled, setEnabled] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const droneOsc1 = useRef<OscillatorNode | null>(null)
  const droneOsc2 = useRef<OscillatorNode | null>(null)
  const masterGain = useRef<GainNode | null>(null)

  const toggle = () => {
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctxRef.current = new AudioCtx()
    }
    const ctx = ctxRef.current

    if (!enabled) {
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      masterGain.current = ctx.createGain()
      masterGain.current.gain.setValueAtTime(0.045, ctx.currentTime)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(240, ctx.currentTime)
      masterGain.current.connect(filter)
      filter.connect(ctx.destination)

      droneOsc1.current = ctx.createOscillator()
      droneOsc1.current.type = 'sine'
      droneOsc1.current.frequency.setValueAtTime(55, ctx.currentTime)
      droneOsc1.current.connect(masterGain.current)
      droneOsc1.current.start()

      droneOsc2.current = ctx.createOscillator()
      droneOsc2.current.type = 'triangle'
      droneOsc2.current.frequency.setValueAtTime(110.5, ctx.currentTime)
      droneOsc2.current.connect(masterGain.current)
      droneOsc2.current.start()

      setEnabled(true)
    } else {
      if (masterGain.current && ctx) {
        masterGain.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
        setTimeout(() => {
          droneOsc1.current?.stop()
          droneOsc2.current?.stop()
          droneOsc1.current?.disconnect()
          droneOsc2.current?.disconnect()
          setEnabled(false)
        }, 300)
      } else {
        setEnabled(false)
      }
    }
  }

  const unlock = () => {
    try {
      if (!ctxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        ctxRef.current = new AudioCtx()
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume()
      }
    } catch {
      // ignore
    }
  }

  const playClick = () => {
    unlock()
    const ctx = ctxRef.current
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.045)
  }

  const playWhoosh = () => {
    try {
      unlock()
      const ctx = ctxRef.current
      if (!ctx) return
      const t = ctx.currentTime

      // 1. Realistic white-noise frequency sweep (air/energy whoosh)
      const bufferSize = Math.floor(ctx.sampleRate * 0.35)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(320, t)
      noiseFilter.frequency.exponentialRampToValueAtTime(2600, t + 0.32)
      noiseFilter.Q.setValueAtTime(2.5, t)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.001, t)
      noiseGain.gain.linearRampToValueAtTime(0.24, t + 0.09)
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(t)

      // 2. Resonant rising cyber chime oscillator
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(160, t)
      osc.frequency.exponentialRampToValueAtTime(840, t + 0.32)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(350, t)
      filter.frequency.exponentialRampToValueAtTime(3000, t + 0.32)

      gain.gain.setValueAtTime(0.001, t)
      gain.gain.linearRampToValueAtTime(0.12, t + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(t)
      osc.stop(t + 0.4)
    } catch {
      // AudioContext unavailable
    }
  }

  const playCollapse = () => {
    try {
      unlock()
      const ctx = ctxRef.current
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.28)

      gain.gain.setValueAtTime(0.09, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.32)
    } catch {
      // ignore
    }
  }

  return { enabled, toggle, playClick, playWhoosh, playCollapse, unlock }
}

// Scrolling data ticker — duplicated for seamless loop
const TICKER_TEXT = 'WEBGPU ENGINE // SPATIAL PORTFOLIO // CREATIVE TECHNOLOGY // THREE.JS + R3F // GSAP ANIMATION // PROCEDURAL AUDIO // WGSL COMPUTE // '
const TICKER_FULL = TICKER_TEXT.repeat(4)

export function Hud({
  section,
  onNavigate,
  onBrowse,
  gpu,
  webgpu,
  perf,
  selected,
  onSelect,
  onToggleQuality,
}: HudProps) {
  const audio = useCyberAudio()
  const bgMusic = useBackgroundMusic()
  const [showMusicPlayer, setShowMusicPlayer] = useState(false)
  const [activeProjectIdx, setActiveProjectIdx] = useState(0)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const activeCardId = selected as CardType | null
  const activeCard = hubCards.find((c) => c.id === activeCardId)

  // Current active index for mobile carousel navigation
  const currentCardIdx = hubCards.findIndex((c) => c.id === (selected || section))
  const activeIdx = currentCardIdx >= 0 ? currentCardIdx : 0
  const currentHubCard = hubCards[activeIdx]

  const handleClose = () => {
    audio.playCollapse()
    onSelect(null)
    onNavigate('home')
  }

  const handleOpenCard = (id: CardType) => {
    audio.playWhoosh()
    onSelect(id)
    onNavigate(id)
  }

  /**
   * Cycles to an adjacent card. With a card open the blade switches content in
   * place; with nothing open it only browses — camera glides, blade stays shut.
   */
  const goToCard = (dir: 1 | -1) => {
    const idx = (activeIdx + dir + hubCards.length) % hubCards.length
    const card = hubCards[idx]
    audio.playWhoosh()
    if (selected) {
      onNavigate(card.id)
      onSelect(card.id)
    } else {
      onBrowse(card.id)
    }
  }

  const handleNextNode = () => goToCard(1)
  const handlePrevNode = () => goToCard(-1)

  // Drag-to-switch for touch AND mouse: a horizontal drag glides between the 3D
  // cards. Any drag past 8px locks the canvas so R3F never treats the gesture as
  // a tap — scrolling/scrubbing over a card must not open it.
  useEffect(() => {
    let activePointer = -1
    let startX = 0
    let startY = 0
    let intentLocked = false // once we know the gesture is a drag

    const blocked = () => selected || showMusicPlayer || showSettings

    const lockCanvas = () => {
      swipeLockRef.current = true
      document.documentElement.classList.add('canvas-swipe-lock')
    }
    const unlockCanvas = () => {
      // Keep the lock alive past pointerup so the synthesized click that follows
      // still sees it (R3F dispatches onClick after pointerup).
      requestAnimationFrame(() => {
        swipeLockRef.current = false
        document.documentElement.classList.remove('canvas-swipe-lock')
      })
    }

    const onPointerDown = (e: PointerEvent) => {
      if (activePointer !== -1 || blocked() || !e.isPrimary) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      // Only gestures that begin on the 3D scene — HUD buttons keep their clicks.
      if ((e.target as HTMLElement | null)?.tagName !== 'CANVAS') return
      activePointer = e.pointerId
      startX = e.clientX
      startY = e.clientY
      intentLocked = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointer || blocked()) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      if (!intentLocked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        intentLocked = true
        lockCanvas()
      }
      // Non-passive listener: freeze the canvas so R3F parallax ignores the drag
      if (swipeLockRef.current) e.preventDefault()
    }

    const finish = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return
      activePointer = -1
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const isHorizontalDrag =
        swipeLockRef.current && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4

      if (isHorizontalDrag && !blocked()) {
        if (dx < 0) handleNextNode()
        else handlePrevNode()
      }
      unlockCanvas()
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    // Non-passive so we can preventDefault to freeze the canvas during drags
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', finish, { passive: true })
    window.addEventListener('pointercancel', finish, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      unlockCanvas()
    }
  }, [selected, showMusicPlayer, showSettings, section, activeIdx])

  // Unlock audio on first user gesture
  useEffect(() => {
    const handleUnlock = () => audio.unlock()
    window.addEventListener('pointerdown', handleUnlock, { once: true })
    window.addEventListener('keydown', handleUnlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handleUnlock)
      window.removeEventListener('keydown', handleUnlock)
    }
  }, [audio])

  // Guarantee whoosh sound fires whenever ANY card opens (3D click, dock, nav)
  const prevSelectedRef = useRef<CardType | null>(null)
  useEffect(() => {
    if (selected && selected !== prevSelectedRef.current) {
      audio.playWhoosh()
    } else if (!selected && prevSelectedRef.current) {
      audio.playCollapse()
    }
    prevSelectedRef.current = selected as CardType | null
  }, [selected, audio])

  // Keyboard accessibility: ESC to return home, 1-5 to inspect nodes, M for music player
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMusicPlayer) {
          setShowMusicPlayer(false)
          return
        }
        if (selected) {
          handleClose()
        }
      } else if (!selected && ['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        if (hubCards[idx]) {
          handleOpenCard(hubCards[idx].id)
        }
      } else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement)) {
        setShowMusicPlayer((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, showMusicPlayer])

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(identity.email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-20 overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Refined Minimalist Luxury)                                  */}
      {/* ========================================================================= */}
      <header className="absolute top-[env(safe-area-inset-top)] left-0 right-0 p-3.5 sm:p-6 md:p-8 short:p-3! flex items-center sm:items-start justify-between pointer-events-auto z-20">
        {/* Top-Left: Brand & Japanese Identity */}
        <div className="flex flex-col pl-[env(safe-area-inset-left)]">
          <button
            onClick={() => {
              audio.playClick()
              handleClose()
            }}
            className="text-left group"
          >
            <div className="relative">
              <h1 className="font-mono text-xl sm:text-2xl md:text-3xl short:text-lg! font-black tracking-wider text-accent flex items-center gap-1.5 group-hover:text-white transition-colors duration-200">
                SMSY <span className="text-xs sm:text-sm font-normal align-super">©</span> 26'
              </h1>
              <h1
                aria-hidden="true"
                className="font-mono text-xl sm:text-2xl md:text-3xl short:text-lg! font-black tracking-wider text-cyan flex items-center gap-1.5 absolute top-0 left-0 pointer-events-none opacity-0 group-hover:opacity-100"
                style={{ animation: 'glitch-clip 0.5s steps(1) infinite', mixBlendMode: 'screen' as const }}
              >
                SMSY <span className="text-xs sm:text-sm font-normal align-super">©</span> 26'
              </h1>
            </div>
            <span className="font-sans text-[0.625rem] sm:text-[0.7rem] font-bold text-cyan tracking-wide mt-0.5 block">
              クリエイティブ テクノロジスト
            </span>
          </button>
          <p className="font-mono text-[0.625rem] font-semibold text-white/50 tracking-widest mt-1 uppercase hidden sm:block short:hidden!">
            CREATIVE DEVELOPMENT • WEBGPU ARCHITECTURE
          </p>
        </div>

        {/* Top-Center: Nav Switcher (Desktop Only) */}
        <nav className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-4 sm:top-6 md:top-8 short:top-2! items-center gap-1 bg-black/70 backdrop-blur-xl border border-accent/40 rounded-full p-1 sm:p-1.5 shadow-[0_0_24px_rgba(0,136,255,0.25)] z-20">
          <button
            onClick={() => {
              audio.playClick()
              handleClose()
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-full font-mono text-[0.7rem] sm:text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
              section === 'home' && !selected
                ? 'bg-accent text-white glow-breathe'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            HUB
          </button>

          {hubCards.map((card) => {
            const isActive = selected === card.id || section === card.id
            return (
              <button
                key={card.id}
                onClick={() => handleOpenCard(card.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full font-mono text-[0.7rem] sm:text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white glow-breathe'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {card.title.split(' ')[0]}
              </button>
            )
          })}
        </nav>

        {/* Top-Right: Mobile Unified Glass Pill & Desktop Diagnostics */}
        <div className="flex items-center gap-1.5 sm:gap-2 pr-[env(safe-area-inset-right)]">
          {/* Mobile-Only Minimalist Glass Capsule */}
          <div className="flex sm:hidden items-center bg-[#070e1e]/80 backdrop-blur-xl border border-cyan/35 rounded-full px-2.5 py-1 gap-2 shadow-[0_0_16px_rgba(0,136,255,0.3)]">
            {/* Audio Indicator / Toggle */}
            <button
              onClick={() => {
                audio.playClick()
                bgMusic.togglePlay()
              }}
              className="flex items-center gap-1 p-1.5 text-cyan active:scale-90 transition-transform"
              title={bgMusic.isPlaying ? 'Pause Background Music' : 'Play Background Music'}
            >
              {bgMusic.isPlaying ? (
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] bg-cyan rounded-full animate-bounce [animation-delay:0s] h-2" />
                  <span className="w-[2px] bg-cyan rounded-full animate-bounce [animation-delay:0.18s] h-3" />
                  <span className="w-[2px] bg-cyan rounded-full animate-bounce [animation-delay:0.35s] h-1.5" />
                </div>
              ) : (
                <span className="text-white/40 text-xs">♪</span>
              )}
            </button>

            {/* Music Player Modal Launcher */}
            <button
              onClick={() => {
                audio.playClick()
                setShowMusicPlayer(true)
              }}
              className="font-mono text-[0.625rem] font-bold text-white/70 hover:text-cyan border-l border-white/15 pl-2 py-1.5 max-w-[70px] truncate"
              title="Open Track Player"
            >
              {bgMusic.isPlaying ? bgMusic.currentTrack.title : 'AUDIO'}
            </button>

            {/* Settings Cog */}
            <button
              onClick={() => {
                audio.playClick()
                setShowSettings(!showSettings)
              }}
              className="text-cyan/80 hover:text-white text-xs border-l border-white/15 p-1.5 pl-2 active:scale-90"
              title="System Diagnostics"
            >
              ⚙
            </button>
          </div>

          {/* Desktop Engine Diagnostics */}
          <div className="hidden lg:flex flex-col items-end">
            <div className="font-mono text-[0.65rem] text-accent font-semibold tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span>
                {webgpu === 'available' ? 'WebGPU' : 'WebGL2'} // {perf.fps} FPS
                <span className="cursor-blink text-cyan">_</span>
              </span>
            </div>
            <span className="font-mono text-[0.625rem] text-white/30 tracking-wide mt-0.5">
              {(1000 / Math.max(1, perf.fps)).toFixed(1)} ms/frame
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE FLOATING CYBER NAVIGATION CAPSULE (VisionOS / Futuristic Style)  */}
      {/* ========================================================================= */}
      {!selected && (
        <div className="sm:hidden fixed bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-25 pointer-events-auto flex flex-col items-center gap-2.5 max-w-[calc(100vw_-_1.5rem)] fade-in-anim">
          {/* Swipe Hint */}
          <div className="flex items-center gap-1.5 font-mono text-[0.625rem] text-white/35 tracking-widest uppercase select-none">
            <span className="opacity-60">←</span>
            <span>swipe or tap to explore</span>
            <span className="opacity-60">→</span>
          </div>

          {/* Pill Capsule */}
          <div className="flex items-center gap-2 max-w-full bg-[#060c1c]/92 backdrop-blur-2xl border border-cyan/40 rounded-full px-3 py-1.5 shadow-[0_10px_36px_rgba(0,136,255,0.45),inset_0_1px_0_rgba(0,229,255,0.4)]">
            {/* Prev Button */}
            <button
              onClick={() => handlePrevNode()}
              className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-white/15 active:scale-85 text-white/80 hover:text-cyan flex items-center justify-center font-mono text-lg font-bold transition-all"
              aria-label="Previous Section"
            >
              ‹
            </button>

            {/* Current Section Info */}
            <button
              onClick={() => handleOpenCard(currentHubCard.id)}
              className="flex flex-col items-center px-2 min-w-0 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-1.5 font-mono text-[0.72rem] font-bold text-white tracking-wider max-w-[7rem] min-w-0">
                <span className="text-cyan text-[0.625rem] shrink-0">{currentHubCard.code}</span>
                <span className="truncate">{currentHubCard.title.split(' ')[0]}</span>
                <span className="text-[0.625rem] font-sans text-cyan/70 font-normal shrink-0">
                  {currentHubCard.kanji}
                </span>
              </div>
              {/* Progress Micro-Dashes */}
              <div className="flex items-center gap-1 mt-1">
                {hubCards.map((card, idx) => (
                  <span
                    key={card.id}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === activeIdx
                        ? 'w-4 bg-cyan shadow-[0_0_8px_#00e5ff]'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </button>

            {/* Next Button */}
            <button
              onClick={() => handleNextNode()}
              className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-white/15 active:scale-85 text-white/80 hover:text-cyan flex items-center justify-center font-mono text-lg font-bold transition-all"
              aria-label="Next Section"
            >
              ›
            </button>

            {/* Divider */}
            <span className="w-px h-5 bg-white/15 shrink-0" />

            {/* EXPAND Button */}
            <button
              onClick={() => handleOpenCard(currentHubCard.id)}
              aria-label="Expand current card"
              className="shrink-0 min-h-9 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-accent to-cyan text-void font-mono text-[0.68rem] font-black uppercase tracking-wider shadow-[0_0_16px_rgba(0,229,255,0.7)] active:scale-90 transition-all duration-150 flex items-center gap-1.5 hover:shadow-[0_0_24px_rgba(0,229,255,0.9)]"
            >
              <span className="max-[360px]:hidden">EXPAND</span>
              <span className="text-[0.75rem] font-normal">⤢</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP BOTTOM CARD SELECTOR / ARC DOCK                                */}
      {/* ========================================================================= */}
      <footer className="absolute bottom-0 left-0 right-0 hidden sm:flex flex-col pointer-events-auto pb-safe z-20">
        {/* Scrolling data ticker strip — hidden on short (landscape) viewports */}
        <div className="w-full overflow-hidden border-t border-accent/20 bg-black/85 backdrop-blur-md py-1 flex items-center short:hidden!">
          <div
            className="whitespace-nowrap font-mono text-[0.625rem] text-accent/70 tracking-widest"
            style={{ animation: 'ticker-scroll 30s linear infinite', display: 'inline-block' }}
          >
            {TICKER_FULL}
          </div>
        </div>

        {/* Card dock row */}
        <div className="flex items-center justify-between pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(3rem,env(safe-area-inset-left))] md:pr-[max(3rem,env(safe-area-inset-right))] py-3 short:py-1.5! bg-black/70 backdrop-blur-xl border-t border-accent/25 gap-2">
          {/* Left: Quick Card Carousel Navigator */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0 mr-3">
            <button
              onClick={() => {
                audio.playClick()
                handleClose()
              }}
              className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-200 border whitespace-nowrap active:scale-95 ${
                section === 'home' && !selected
                  ? 'bg-accent text-white border-cyan shadow-[0_0_18px_rgba(0,136,255,0.7)] glow-breathe'
                  : 'bg-black/60 text-white/60 border-white/10 hover:border-accent/60 hover:text-white'
              }`}
            >
              <span>HUB</span>
              <span className="text-[0.65rem] text-white/40">起点</span>
            </button>

            {hubCards.map((card, i) => {
              // Highlight when browsed-to OR open; only collapse when it's the open one.
              const isOpen = selected === card.id
              const isCurrent = isOpen || section === card.id
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    if (isOpen) {
                      handleClose()
                    } else {
                      handleOpenCard(card.id)
                    }
                  }}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-200 border overflow-hidden whitespace-nowrap flex-shrink-0 active:scale-95 ${
                    isCurrent
                      ? 'bg-accent text-white border-cyan shadow-[0_0_20px_rgba(0,136,255,0.75)]'
                      : 'bg-black/60 text-white/70 border-white/10 hover:border-accent/60 hover:text-white hover:bg-accent/10'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="text-cyan text-[0.65rem] relative z-10">{card.code}</span>
                  <span className="relative z-10">{card.title.split(' ')[0]}</span>
                  <span className="text-[0.68rem] font-sans text-white/40 relative z-10">{card.kanji}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-accent to-cyan transition-all duration-300 ${
                      isCurrent ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          {/* Right: Sound & Settings buttons */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Music Player Trigger Pill */}
            <button
              onClick={() => {
                audio.playClick()
                setShowMusicPlayer(true)
              }}
              className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold border transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                bgMusic.isPlaying
                  ? 'bg-accent/80 text-white border-cyan shadow-[0_0_14px_rgba(0,136,255,0.7)]'
                  : 'bg-black/60 text-white/60 border-white/15 hover:text-white hover:border-accent/40'
              }`}
              title="Open Music Player (M)"
            >
              {bgMusic.isPlaying ? (
                <span className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px] h-2.5">
                    <span className="w-[2px] bg-cyan rounded-full animate-bounce [animation-delay:0s] h-2" />
                    <span className="w-[2px] bg-cyan rounded-full animate-bounce [animation-delay:0.18s] h-3" />
                    <span className="w-[2px] bg-cyan rounded-full animate-bounce [animation-delay:0.35s] h-1.5" />
                  </span>
                  <span className="max-w-[120px] truncate">
                    {bgMusic.currentTrack.title}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span>♪</span>
                  <span>MUSIC</span>
                </span>
              )}
            </button>

            {/* Quick Play/Pause Button */}
            <button
              onClick={() => {
                audio.playClick()
                bgMusic.togglePlay()
              }}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 ${
                bgMusic.isPlaying
                  ? 'bg-cyan text-void border-cyan shadow-[0_0_12px_rgba(0,229,255,0.6)]'
                  : 'bg-white/5 border-white/20 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={bgMusic.isPlaying ? 'Pause Background Music' : 'Play Background Music'}
            >
              {bgMusic.isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 rounded-full bg-accent/20 border border-accent/50 text-accent flex items-center justify-center font-bold text-sm hover:bg-accent hover:text-white transition-all duration-200 hover:shadow-[0_0_12px_rgba(0,136,255,0.5)] active:scale-95"
              title="System Diagnostics"
            >
              ⚙
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal (Responsive) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-0 pointer-events-auto fade-in-anim">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
            title="Click backdrop to close"
          />
          <div className="relative w-full max-w-sm sm:w-80 bg-black/95 border border-accent/70 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-[0_0_36px_rgba(0,136,255,0.35)] sheet-open-anim mb-[calc(4rem_+_env(safe-area-inset-bottom))] sm:mb-0 sm:absolute sm:bottom-24 sm:right-8">
            <div className="flex items-center justify-between border-b border-accent/30 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-cyan uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                System Diagnostics
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 -m-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center font-mono text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3 font-mono text-xs text-white/80">
              <div className="flex items-center justify-between">
                <span>RENDER TIER</span>
                <button
                  onClick={onToggleQuality}
                  className="px-3 py-1 rounded bg-accent text-white font-bold text-[0.68rem] hover:bg-white hover:text-void transition-colors shadow-[0_0_10px_rgba(0,136,255,0.5)]"
                >
                  {perf.quality.toUpperCase()}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>BGM ELEVATOR</span>
                <button
                  onClick={bgMusic.togglePlay}
                  className="px-2.5 py-1 rounded bg-accent/20 border border-accent/40 text-cyan font-bold text-[0.65rem] hover:bg-accent hover:text-white transition-colors"
                >
                  {bgMusic.isPlaying ? `PLAYING (${Math.round(bgMusic.volume * 100)}%)` : 'PAUSED'}
                </button>
              </div>
              <div className="border-t border-white/10 pt-2 flex flex-col gap-1 text-[0.65rem] text-accent/70">
                <span className="truncate">GPU: {gpu.renderer}</span>
                <span>API: {webgpu === 'available' ? 'WebGPU Native' : 'WebGL2 Emulated'}</span>
                <span>FPS: {perf.fps} ({(1000 / Math.max(1, perf.fps)).toFixed(1)} ms)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SPATIAL INSPECTION HUD (CYBER BLADE & TELEMETRY RAIL)                  */}
      {/* ========================================================================= */}
      {activeCard && (
        <>
          {/* Ambient depth backdrop: clicking anywhere on the 3D scene closes inspection */}
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-20 pointer-events-auto backdrop-open-anim"
            title="Click void to return to orbit"
          />

          {/* Cinematic Viewport Framing Markers (HUD Crosshairs & Grid Lines) */}
          <div className="fixed inset-4 pointer-events-none z-20 hidden md:block">
            {/* Top-Left crosshair */}
            <div className="absolute top-0 left-0 font-mono text-[0.65rem] text-cyan/50 flex items-center gap-1.5">
              <span className="text-cyan font-bold">+</span>
              <span>SYS.VIEWPORT // {activeCard.code}</span>
            </div>
            {/* Top-Right crosshair */}
            <div className="absolute top-0 right-0 font-mono text-[0.65rem] text-cyan/50 flex items-center gap-1.5">
              <span>TARGET.LOCKED</span>
              <span className="text-cyan font-bold">+</span>
            </div>
            {/* Bottom-Left coordinate */}
            <div className="absolute bottom-10 left-0 font-mono text-[0.65rem] text-accent/60 flex items-center gap-1.5">
              <span className="text-accent font-bold">+</span>
              <span>6DOF ACTIVE // TILT ±12° // PARIS [UTC+1]</span>
            </div>
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan/40" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan/40" />
            <div className="absolute bottom-10 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan/40" />
            <div className="absolute bottom-10 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan/40" />
          </div>

          {/* LEFT: Futuristic Telemetry Rail (Visible on LG screens) */}
          <aside className="hidden lg:flex fixed left-8 top-28 bottom-24 flex-col justify-between pointer-events-auto z-30 rail-open-anim w-60">
            {/* Telemetry Block */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#060913]/85 border border-accent/40 backdrop-blur-xl shadow-[0_0_24px_rgba(0,136,255,0.2)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                <span className="font-mono text-[0.68rem] text-cyan font-bold tracking-widest uppercase">
                  SPATIAL TELEMETRY
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[0.68rem] text-white/70">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/40">NODE</span>
                  <span className="text-cyan font-bold">{activeCard.code}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/40">SECTOR</span>
                  <span className="text-white">{activeCard.kanji}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white/40">CAMERA</span>
                  <span className="text-accent font-semibold">INSPECT_RIG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">6DOF TILT</span>
                  <span className="text-cyan animate-pulse">SYNCHRONIZED</span>
                </div>
              </div>
            </div>

            {/* Quick Node Switcher Vertical Pill Deck */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#060913]/85 border border-accent/35 backdrop-blur-xl shadow-[0_0_20px_rgba(0,136,255,0.15)]">
              <span className="font-mono text-[0.625rem] text-white/50 tracking-wider mb-1 px-1">
                SWITCH NODE // 1-5
              </span>
              {hubCards.map((card, idx) => {
                const isSelected = selected === card.id
                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      if (!isSelected) {
                        audio.playClick()
                        handleOpenCard(card.id)
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-mono text-[0.72rem] font-bold transition-all duration-200 border ${
                      isSelected
                        ? 'bg-accent text-white border-cyan shadow-[0_0_14px_rgba(0,136,255,0.7)]'
                        : 'bg-white/5 text-white/60 border-white/10 hover:border-cyan/50 hover:text-white hover:bg-accent/10'
                    }`}
                  >
                    <span className="text-cyan text-[0.65rem]">{idx + 1}</span>
                    <span>{card.title.split(' ')[0]}</span>
                    <span className="text-[0.68rem] text-white/40 font-sans">{card.kanji}</span>
                  </button>
                )
              })}
            </div>

            {/* Return / ESC button */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/15 border border-accent/40 text-cyan hover:bg-accent hover:text-white font-mono text-xs font-bold transition-all duration-200 shadow-[0_0_16px_rgba(0,136,255,0.25)] hover:shadow-[0_0_24px_rgba(0,136,255,0.6)] active:scale-95"
            >
              <span>✕</span>
              <span>RETURN TO ORBIT</span>
              <span className="text-[0.625rem] text-white/60 bg-black/50 px-1.5 py-0.5 rounded border border-white/20">
                ESC
              </span>
            </button>
          </aside>

          {/* RIGHT / CENTER: Aesthetic Expanded Floating Hologram Card */}
          <section
            aria-label="Node Inspector"
            className="fixed inset-3 bottom-[calc(1.25rem_+_env(safe-area-inset-bottom))] top-[calc(env(safe-area-inset-top)_+_4rem)] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 lg:left-[calc(50%_+_110px)] xl:left-1/2 w-auto sm:w-[600px] md:w-[680px] max-h-[88dvh] z-40 pointer-events-auto flex flex-col bg-gradient-to-b from-[#0a1428]/95 via-[#060c1c]/98 to-[#030610]/99 backdrop-blur-3xl border border-cyan/40 rounded-[26px] sm:rounded-3xl shadow-[0_0_80px_rgba(0,102,255,0.5),inset_0_1px_0_rgba(0,240,255,0.5)] overflow-hidden blade-open-anim"
          >
            {/* Top glowing cyan edge accent */}
            <div className="h-[2px] w-full bg-gradient-to-r from-accent via-cyan to-accent" />

            {/* Cyber Corner Ticks (Desktop) */}
            <div className="hidden sm:block absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan/80 pointer-events-none" />
            <div className="hidden sm:block absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan/80 pointer-events-none" />
            <div className="hidden sm:block absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan/80 pointer-events-none" />
            <div className="hidden sm:block absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan/80 pointer-events-none" />

            {/* Blade Header */}
            <header className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-accent/25 flex items-center justify-between bg-black/40 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 font-mono text-[0.625rem] sm:text-[0.68rem] text-cyan font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#00e5ff]" />
                  <span>SEC.{activeCard.code.replace('HUB-', '')} // {activeCard.kanji}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60">{activeCard.metricLabel}</span>
                </div>
                <h2 className="font-sans text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  {activeCard.title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-cyan/20 border border-white/20 hover:border-cyan text-white/80 hover:text-cyan flex items-center justify-center font-bold text-xs transition-all active:scale-90 shadow-[0_0_12px_rgba(0,136,255,0.3)]"
                title="Return to Orbit (ESC)"
              >
                ✕
              </button>
            </header>

            {/* Sub-Nav Bar: Sleek Segmented Switcher */}
            <div className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 border-b border-accent/20 bg-black/40 overflow-x-auto scrollbar-none flex-shrink-0">
              {hubCards.map((c, idx) => {
                const isCurrent = activeCard.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (!isCurrent) handleOpenCard(c.id)
                    }}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[0.68rem] sm:text-xs font-bold border transition-all active:scale-95 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-accent to-cyan text-void font-black border-cyan shadow-[0_0_14px_rgba(0,229,255,0.6)]'
                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/25'
                    }`}
                  >
                    <span className={isCurrent ? 'text-void/70' : 'text-cyan'}>{String(idx + 1).padStart(2, '0')}</span>
                    <span>{c.title.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain blade-scroll pb-safe">
              {/* --- A. WORKS VIEW --- */}
              {activeCard.id === 'works' && (
                <div className="space-y-4">
                  {/* Project Selector Chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {projects.map((p, idx) => (
                      <button
                        key={p.slug}
                        onClick={() => {
                          audio.playClick()
                          setActiveProjectIdx(idx)
                        }}
                        className={`relative px-3 py-1.5 rounded-full font-mono text-xs font-bold whitespace-nowrap transition-all duration-200 border active:scale-95 ${
                          activeProjectIdx === idx
                            ? 'bg-accent text-white border-cyan shadow-[0_0_14px_rgba(0,136,255,0.6)]'
                            : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-accent/40'
                        }`}
                      >
                        {idx + 1}. {p.title}
                      </button>
                    ))}
                  </div>

                  {/* Active Project Card Details */}
                  {projects[activeProjectIdx] && (
                    <div className="bg-[#0b1324]/85 border border-cyan/25 rounded-2xl p-5 relative overflow-hidden shadow-[0_4px_24px_rgba(0,102,255,0.25)]">
                      <div className="flex items-center justify-between text-xs font-mono text-cyan mb-2">
                        <span>[ {projects[activeProjectIdx].kanji} // PRODUCTION ]</span>
                        <span className="text-white/60">{projects[activeProjectIdx].year}</span>
                      </div>
                      <h3 className="font-sans text-2xl sm:text-3xl font-black text-white mb-1.5">
                        {projects[activeProjectIdx].title}
                      </h3>
                      <div className="font-mono text-xs font-semibold text-cyan mb-3">
                        ROLE // {projects[activeProjectIdx].role.toUpperCase()}
                      </div>

                      <p className="font-sans text-sm text-white/85 leading-relaxed mb-5">
                        {projects[activeProjectIdx].blurb}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {projects[activeProjectIdx].stack.map((s) => (
                          <span
                            key={s}
                            className="font-mono text-[0.68rem] bg-accent/20 border border-accent/40 text-cyan px-2.5 py-0.5 rounded-md"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {projects[activeProjectIdx].href && (
                          <a
                            href={projects[activeProjectIdx].href}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-accent to-cyan text-void font-mono font-black text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(0,229,255,0.6)] flex items-center justify-center gap-2 text-center"
                          >
                            <span>LAUNCH SITE</span>
                            <span>↗</span>
                          </a>
                        )}
                        {projects[activeProjectIdx].repo && (
                          <a
                            href={projects[activeProjectIdx].repo}
                            target="_blank"
                            rel="noreferrer"
                            className="py-3 px-4 rounded-xl bg-white/5 border border-white/20 hover:border-cyan text-white font-mono text-xs sm:text-sm font-bold active:scale-95 transition-all duration-200 text-center"
                          >
                            SOURCE CODE
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- B. ABOUT VIEW --- */}
              {activeCard.id === 'about' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 text-white/90 text-sm leading-relaxed bg-[#0b1324]/85 p-5 rounded-2xl border border-accent/30 shadow-[0_4px_20px_rgba(0,102,255,0.2)]">
                    <span className="font-mono text-xs text-accent font-bold uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      English Manifesto
                    </span>
                    {identity.bioEn.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 text-cyan/95 text-sm leading-relaxed bg-[#09152b]/85 p-5 rounded-2xl border border-cyan/30 shadow-[0_4px_20px_rgba(0,229,255,0.2)]">
                    <span className="font-mono text-xs text-cyan font-bold uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                      日本語プロファイル
                    </span>
                    {identity.bioJa.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  {/* Social Link Cards Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {identity.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan hover:bg-cyan/10 text-white font-mono text-xs transition-all active:scale-95"
                      >
                        <span>{link.label}</span>
                        <span className="text-cyan text-sm">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* --- C. LAB VIEW --- */}
              {activeCard.id === 'lab' && (
                <div className="space-y-3.5">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="group bg-[#0b1324]/85 border border-accent/40 rounded-2xl p-4.5 hover:border-cyan transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_24px_rgba(0,229,255,0.2)]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[0.65rem] text-cyan font-bold">LATENCY &lt; 2.5ms</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent/60 group-hover:bg-cyan transition-colors duration-200 animate-pulse" />
                        </div>
                        <h4 className="font-mono text-sm font-bold text-white uppercase mb-1.5 group-hover:text-cyan transition-colors duration-200">
                          {note.title}
                        </h4>
                        <p className="font-sans text-xs text-white/80 leading-relaxed mb-3">
                          {note.body}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-[0.65rem] bg-accent/20 text-cyan px-2.5 py-0.5 rounded-md border border-accent/40"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- D. AUDIO VIEW --- */}
              {activeCard.id === 'audio' && (
                <div className="space-y-4">
                  <MusicPlayer player={bgMusic} compact />
                </div>
              )}

              {/* --- E. CONTACT VIEW --- */}
              {activeCard.id === 'contact' && (
                <div className="space-y-4">
                  <div className="bg-[#0b1324]/85 border border-accent/40 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_rgba(0,102,255,0.2)]">
                    <span className="font-mono text-xs text-cyan font-bold block">
                      PRIMARY TRANSMISSION FREQUENCY
                    </span>
                    <p className="font-sans text-xs text-white/80 leading-relaxed">
                      Direct inquiries for creative engineering, WebGPU architecture, and spatial
                      design commissions.
                    </p>
                    <div className="flex items-center justify-between bg-black/70 border border-white/10 rounded-xl p-3.5">
                      <span className="font-mono text-xs sm:text-sm text-white font-bold truncate mr-2">
                        {identity.email}
                      </span>
                      <button
                        onClick={handleCopyEmail}
                        className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                          copiedEmail
                            ? 'bg-cyan text-void shadow-[0_0_12px_rgba(0,229,255,0.6)]'
                            : 'bg-accent text-white hover:bg-white hover:text-void shadow-[0_0_10px_rgba(0,136,255,0.4)]'
                        }`}
                      >
                        {copiedEmail ? '✓ COPIED!' : 'COPY EMAIL'}
                      </button>
                    </div>

                    <a
                      href={`mailto:${identity.email}`}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-cyan text-void font-mono font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(0,229,255,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
                    >
                      <span>OPEN MAIL CLIENT</span>
                      <span>↗</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {identity.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 text-white hover:border-cyan hover:bg-accent/15 transition-all duration-200 active:scale-95"
                      >
                        <span className="font-mono text-xs">{link.label}</span>
                        <span className="text-cyan text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Collapse Footer Bar */}
            <footer className="flex-shrink-0 border-t border-cyan/20 bg-gradient-to-r from-[#060c1c]/95 via-[#0a1428]/95 to-[#060c1c]/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
              {/* Left: quick node switcher arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevNode}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-cyan/50 text-white/60 hover:text-cyan flex items-center justify-center font-mono text-sm transition-all active:scale-90"
                  aria-label="Previous card"
                >
                  ‹
                </button>
                <span className="font-mono text-[0.625rem] text-white/30 tracking-wider">
                  {String(activeIdx + 1).padStart(2, '0')} / {String(hubCards.length).padStart(2, '0')}
                </span>
                <button
                  onClick={handleNextNode}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-cyan/50 text-white/60 hover:text-cyan flex items-center justify-center font-mono text-sm transition-all active:scale-90"
                  aria-label="Next card"
                >
                  ›
                </button>
              </div>

              {/* Center: collapse button */}
              <button
                onClick={handleClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-accent/15 border border-white/10 hover:border-cyan/50 text-white/70 hover:text-cyan font-mono text-xs font-bold tracking-widest transition-all duration-200 active:scale-95 group"
              >
                <span className="text-[0.65rem] group-hover:text-accent transition-colors">✕</span>
                <span>COLLAPSE CARD</span>
                <span className="text-[0.625rem] text-white/30 bg-black/40 px-1.5 py-0.5 rounded border border-white/15">ESC</span>
              </button>

              {/* Right: play/pause mini control */}
              <button
                onClick={() => { audio.playClick(); bgMusic.togglePlay() }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0 ${
                  bgMusic.isPlaying
                    ? 'bg-cyan/20 text-cyan border-cyan/50 shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                    : 'bg-white/5 border-white/15 text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title={bgMusic.isPlaying ? 'Pause' : 'Play Music'}
              >
                {bgMusic.isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </footer>
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. FLOATING MUSIC PLAYER MODAL (Nazia-99 / Cyber Theme)                    */}
      {/* ========================================================================= */}
      {showMusicPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md pointer-events-auto fade-in-anim">
          <div
            className="absolute inset-0"
            onClick={() => setShowMusicPlayer(false)}
            title="Click backdrop to close"
          />
          <MusicPlayer player={bgMusic} onClose={() => setShowMusicPlayer(false)} isModal />
        </div>
      )}
    </div>
  )
}
import { useState, useEffect, useRef, useCallback } from 'react'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  year: string
  src: string
  estimatedDuration?: number
}

export const PLAYLIST: Track[] = [
  {
    id: 'attention',
    title: 'Attention',
    artist: 'Bryson Tiller',
    album: 'Visualizer Series',
    year: '2020',
    src: '/music/Bryson Tiller - Attention (Visualizer).mp3',
    estimatedDuration: 185,
  },
  {
    id: 'been-that-way',
    title: 'Been That Way',
    artist: 'Bryson Tiller',
    album: 'T R A P S O U L',
    year: '2015',
    src: '/music/Bryson Tiller - Been That Way (Audio).mp3',
    estimatedDuration: 199,
  },
  {
    id: 'let-me-explain',
    title: 'Let Me Explain',
    artist: 'Bryson Tiller',
    album: 'Single Archive',
    year: '2016',
    src: '/music/Bryson Tiller - Let Me Explain (Audio).mp3',
    estimatedDuration: 198,
  },
  {
    id: 'sorrows',
    title: 'Sorrows',
    artist: 'Bryson Tiller',
    album: 'Anniversary',
    year: '2020',
    src: '/music/Bryson Tiller - Sorrows (Official Video).mp3',
    estimatedDuration: 195,
  },
  {
    id: 'say-it',
    title: 'Say It',
    artist: 'Tory Lanez',
    album: 'I Told You',
    year: '2015',
    src: '/music/Tory Lanez Say It (Audio).mp3',
    estimatedDuration: 247,
  },
  {
    id: 'what-you-need',
    title: 'What You Need',
    artist: 'The Weeknd (durdnn remix)',
    album: 'Trilogy // Echoes',
    year: '2021',
    src: '/music/WHAT YOU NEED - The Weeknd (remix by durdnn).mp3',
    estimatedDuration: 215,
  },
]

export interface MusicPlayerState {
  playlist: Track[]
  currentIndex: number
  currentTrack: Track
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffle: boolean
  isRepeat: boolean
  play: () => void
  pause: () => void
  togglePlay: () => void
  playTrack: (index: number) => void
  nextTrack: () => void
  prevTrack: () => void
  seek: (seconds: number) => void
  setVolume: (val: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
}

// Global audio + Web Audio for smooth crossfading
let globalAudio: HTMLAudioElement | null = null
let globalCtx: AudioContext | null = null
let globalGain: GainNode | null = null

const DEFAULT_VOL = 0.035 // very subtle ambient elevator
const CROSSFADE_MS = 1200 // smooth crossfade between tracks

function ensureAudioContext(audio: HTMLAudioElement) {
  if (globalCtx) return globalCtx
  const AudioCtx =
    (window as any).AudioContext ||
    (window as any).webkitAudioContext
  if (!AudioCtx) return null
  try {
    const ctx = new AudioCtx()
    const source = ctx.createMediaElementSource(audio)
    const gain = ctx.createGain()
    // Start at 0, we'll ramp up on first play
    gain.gain.value = 0.0001
    source.connect(gain)
    gain.connect(ctx.destination)
    globalCtx = ctx
    globalGain = gain
  } catch {
    globalCtx = null
    globalGain = null
  }
  return globalCtx
}

function getAudioInstance(): HTMLAudioElement {
  if (!globalAudio && typeof window !== 'undefined') {
    globalAudio = new Audio()
    globalAudio.preload = 'metadata'
    globalAudio.volume = 1.0 // volume fully controlled by GainNode
    ensureAudioContext(globalAudio)
  }
  return globalAudio!
}

export function useBackgroundMusic(): MusicPlayerState {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(PLAYLIST[0].estimatedDuration ?? 185)
  // Ambient elevator music default volume: 0.09 (9%)
  const [volume, setVolumeState] = useState(DEFAULT_VOL)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)

  const isShuffleRef = useRef(isShuffle)
  isShuffleRef.current = isShuffle
  const isRepeatRef = useRef(isRepeat)
  isRepeatRef.current = isRepeat
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex
  const volumeRef = useRef(DEFAULT_VOL)

  const currentTrack = PLAYLIST[currentIndex]

  // Setup audio element events
  useEffect(() => {
    const audio = getAudioInstance()
    const ctx = ensureAudioContext(audio)

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const onEnded = () => {
      if (isRepeatRef.current) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        advance(1)
      }
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    // Load initial source if not set
    if (!audio.src || !audio.src.includes(encodeURI(PLAYLIST[0].src))) {
      audio.src = PLAYLIST[0].src
    }

    // Auto-start background elevator music on first user gesture if browser permits
    const startAudioOnFirstGesture = async () => {
      try {
        if (ctx && ctx.state === 'suspended') {
          await ctx.resume()
        }
        if (globalGain) {
          const t = ctx?.currentTime ?? 0
          globalGain.gain.setValueAtTime(globalGain.gain.value || 0.0001, t)
          globalGain.gain.linearRampToValueAtTime(volumeRef.current || DEFAULT_VOL, t + 0.8)
        }
        if (audio.paused) {
          await audio.play()
          setIsPlaying(true)
        }
      } catch {}
    }
    window.addEventListener('pointerdown', startAudioOnFirstGesture, { once: true })
    window.addEventListener('keydown', startAudioOnFirstGesture, { once: true })

    return () => {
      window.removeEventListener('pointerdown', startAudioOnFirstGesture)
      window.removeEventListener('keydown', startAudioOnFirstGesture)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [])

  const playTrack = useCallback((index: number) => {
    const audio = getAudioInstance()
    const ctx = ensureAudioContext(audio)
    const safeIdx = Math.max(0, Math.min(PLAYLIST.length - 1, index))
    setCurrentIndex(safeIdx)
    const track = PLAYLIST[safeIdx]

    const fadeOut = () => {
      if (globalGain && ctx) {
        const t = ctx.currentTime
        globalGain.gain.setValueAtTime(globalGain.gain.value, t)
        globalGain.gain.linearRampToValueAtTime(0.0001, t + CROSSFADE_MS / 1000)
      }
    }

    const loadAndPlay = async () => {
      audio.src = track.src
      audio.currentTime = 0
      try {
        if (ctx && ctx.state === 'suspended') await ctx.resume()
        await audio.play()
        setIsPlaying(true)
        if (globalGain && ctx) {
          const t = ctx.currentTime + 0.01
          globalGain.gain.setValueAtTime(0.0001, t)
          globalGain.gain.linearRampToValueAtTime(volumeRef.current || DEFAULT_VOL, t + CROSSFADE_MS / 1000)
        }
      } catch {
        // Autoplay policy or user gesture requirement
      }
    }

    fadeOut()
    setTimeout(loadAndPlay, CROSSFADE_MS)
  }, [])

  const advance = useCallback((dir: number) => {
    const current = currentIndexRef.current
    let nextIdx: number
    if (isShuffleRef.current) {
      do {
        nextIdx = Math.floor(Math.random() * PLAYLIST.length)
      } while (nextIdx === current && PLAYLIST.length > 1)
    } else {
      nextIdx = (current + dir + PLAYLIST.length) % PLAYLIST.length
    }
    playTrack(nextIdx)
  }, [playTrack])

  const nextTrack = useCallback(() => {
    advance(1)
  }, [advance])

  const prevTrack = useCallback(() => {
    const audio = getAudioInstance()
    if (audio.currentTime > 3) {
      audio.currentTime = 0
    } else {
      advance(-1)
    }
  }, [advance])

  const play = useCallback(() => {
    const audio = getAudioInstance()
    audio.play().then(() => {
      setIsPlaying(true)
    }).catch(() => {})
  }, [])

  const pause = useCallback(() => {
    const audio = getAudioInstance()
    audio.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    const audio = getAudioInstance()
    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {})
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = useCallback((seconds: number) => {
    const audio = getAudioInstance()
    const safeSec = Math.max(0, Math.min(duration, seconds))
    audio.currentTime = safeSec
    setCurrentTime(safeSec)
  }, [duration])

  const setVolume = useCallback((val: number) => {
    const audio = getAudioInstance()
    const ctx = ensureAudioContext(audio)
    const safeVol = Math.max(0, Math.min(1, val))
    volumeRef.current = safeVol
    if (globalGain && ctx) {
      const t = ctx.currentTime
      globalGain.gain.cancelScheduledValues(t)
      globalGain.gain.setValueAtTime(globalGain.gain.value, t)
      globalGain.gain.linearRampToValueAtTime(safeVol, t + 0.2)
    }
    setVolumeState(safeVol)
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffle((s) => !s)
  }, [])

  const toggleRepeat = useCallback(() => {
    setIsRepeat((r) => !r)
  }, [])

  return {
    playlist: PLAYLIST,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffle,
    isRepeat,
    play,
    pause,
    togglePlay,
    playTrack,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  }
}

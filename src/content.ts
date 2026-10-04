export type CardType = 'works' | 'about' | 'lab' | 'audio' | 'contact'
export type SectionId = 'home' | 'works' | 'about' | 'lab' | 'audio' | 'contact'

export interface HubCard {
  id: CardType
  code: string
  title: string
  kanji: string
  subtitle: string
  tagline: string
  metricLabel: string
  metricValue: string
  tags: string[]
  position: [number, number]
  accentColor?: string
}

export interface Project {
  slug: string
  title: string
  kanji: string
  year: number
  role: string
  blurb: string
  stack: string[]
  href?: string
  repo?: string
}

export interface LabNote {
  id: string
  title: string
  body: string
  tags: string[]
}

export const identity = {
  name: 'SMSY',
  handle: '@samsy',
  role: 'Creative Technologist // Graphics Engineer',
  location: 'Paris, France',
  year: 2026,
  email: 'contact@samsy.ninja',
  links: [
    { label: 'CONTACT', href: 'mailto:contact@samsy.ninja' },
    { label: 'X / TWITTER', href: 'https://x.com/samsyyyy' },
    { label: 'GITHUB', href: 'https://github.com' },
    { label: 'LINKEDIN', href: 'https://linkedin.com' },
  ],
  bioEn: [
    'My projects are influenced by everyone I meet, from Gobelins school, university classmates, Google Creative Lab, artist friends and makers. They’ve all helped me develop my signature technique throughout the years.',
    'I started working in digital 12 years ago from Paris. Since then, I’ve earned 50+ international awards including Gold Cannes Lion, Awwwards, Adobe Cutting Edge, and FWA (days, months, and year award) both as an independent creative technologist and as part of teams.',
    'I help people understand technical and graphical challenges shaping digital experiences, creating 3D interactive graphics, computational code, marketing experiences, & visual arts.',
  ],
  bioJa: [
    '私はデジタル体験を形作るための技術的およびグラフィックな課題を明確にし、3Dインタラクティブグラフィックス、計算コード、ビジュアルアート等の制作を支援しています。',
    '私は現在フリーランスでのプロジェクト対応が可能です。12年前からパリを拠点にデジタル制作を開始し、カンヌライオンズ金賞、FWA、Awwwardsなど50以上の国際的な賞を受賞しました。',
    '技術的および視覚的な挑戦を通じて、新しいWebGPU/WebGLデジタル体験を創造しています。',
  ],
} as const

export const hubCards: HubCard[] = [
  {
    id: 'works',
    code: 'HUB-01',
    title: 'FEATURED WORKS',
    kanji: '作品',
    subtitle: 'PORTFOLIO // PRODUCTION REEL',
    tagline: 'Interactive 3D experiences, WebGPU compute clusters, and metaverse avatar architectures.',
    metricLabel: 'PRODUCTION REEL',
    metricValue: '6 RELEASES',
    tags: ['WEBGPU', 'THREE.JS', 'SHADERS', 'METAVERSE'],
    position: [-8.4, 0.2],
  },
  {
    id: 'about',
    code: 'HUB-02',
    title: 'TRANSMISSION & BIO',
    kanji: '概要',
    subtitle: 'CREATIVE TECHNOLOGIST',
    tagline: '12 years in Paris shaping graphical challenges, computational code, and award-winning experiences.',
    metricLabel: 'GLOBAL HONORS',
    metricValue: '50+ AWARDS',
    tags: ['GOLD CANNES', 'FWA OF YEAR', 'AWWWARDS'],
    position: [-4.2, 1.8],
  },
  {
    id: 'lab',
    code: 'HUB-03',
    title: 'SHADER & WGPU LAB',
    kanji: '実験',
    subtitle: 'VOLUMETRIC COMPUTE',
    tagline: 'Experimental WGSL compute kernels, real-time reflection budgets, and procedural geometries.',
    metricLabel: 'FRAME LATENCY',
    metricValue: '< 4.2 MS',
    tags: ['WGSL', 'COMPUTE', 'CRDT', 'GLSL'],
    position: [0.0, 2.4],
  },
  {
    id: 'audio',
    code: 'HUB-04',
    title: 'SYNTH & SOUND CORE',
    kanji: '音波',
    subtitle: 'BINAURAL SPATIAL AUDIO',
    tagline: 'Cybernetic atmospheric drone synthesizers with native Web Audio harmonic resonance.',
    metricLabel: 'AUDIO DSP',
    metricValue: '44.1 KHZ',
    tags: ['WEB AUDIO', 'SYNTH', 'DSP', 'SPATIAL'],
    position: [4.2, 1.8],
  },
  {
    id: 'contact',
    code: 'HUB-05',
    title: 'DIRECT UPLINK',
    kanji: '通信',
    subtitle: 'INQUIRIES & AVAILABILITY',
    tagline: 'Available for select creative direction, technical consulting, and high-impact 3D engineering.',
    metricLabel: 'STATUS',
    metricValue: 'AVAILABLE',
    tags: ['PARIS (UTC+1)', 'REMOTE', 'CONSULTING'],
    position: [8.4, 0.2],
  },
]

export const projects: Project[] = [
  {
    slug: 'clonex',
    title: 'Clonex',
    kanji: '複製体',
    year: 2026,
    role: 'Lead Creative Engineer',
    blurb:
      'A collaboration with Takashi Murakami & RTFKT. WebGPU avatar reveal ecosystem, real-time procedural shaders, and high-frequency spatial graphics.',
    stack: ['WebGPU', 'RTFKT', 'Shaders', 'Three.js'],
    href: 'https://rtfkt.com',
    repo: 'https://github.com',
  },
  {
    slug: 'orbital',
    title: 'Orbital Systems',
    kanji: '軌道網',
    year: 2026,
    role: 'Lead Architect',
    blurb:
      'Distributed WebGPU simulation cluster with real-time particle compute and sub-millisecond node synchronization.',
    stack: ['WebGPU', 'WGSL', 'Rust'],
    repo: 'https://github.com',
  },
  {
    slug: 'driftwood',
    title: 'Driftwood',
    kanji: '漂流木',
    year: 2025,
    role: 'Design Engineer',
    blurb: 'Generative biometric identity system driven by high-frequency spatial canvas shaders.',
    stack: ['GLSL', 'Canvas2D', 'Node'],
  },
  {
    slug: 'halcyon',
    title: 'Halcyon Core',
    kanji: '電脳核',
    year: 2025,
    role: 'Founding Engineer',
    blurb: 'Real-time collaborative 3D scene compositor. CRDT memory sync, multi-pass bloom & SSR.',
    stack: ['TypeScript', 'WebGL2', 'CRDT'],
    href: 'https://example.com',
  },
  {
    slug: 'lattice',
    title: 'Lattice Telemetry',
    kanji: '格子網',
    year: 2024,
    role: 'Graphics Systems',
    blurb: 'Realtime high-throughput volumetric telemetry pipeline visualizing 50k live network events/sec.',
    stack: ['ClickHouse', 'Three.js', 'Go'],
  },
  {
    slug: 'tessellate',
    title: 'Tessellate',
    kanji: '多面体',
    year: 2024,
    role: 'Solo Build',
    blurb: 'Procedural parametric mesh generator with 40+ primitives and zero runtime overhead.',
    stack: ['WebGPU', 'WGSL', 'Compute'],
    repo: 'https://github.com',
  },
]

export const notes: LabNote[] = [
  {
    id: 'ssr-budget',
    title: 'Reflection budgets in WebGPU',
    body: 'Render-target reflections cost more than screen-space at grazing angles. Bounding the kernel radius beats adding taps.',
    tags: ['graphics', 'perf'],
  },
  {
    id: 'gsap-bezier',
    title: 'Cinematic Quaternions',
    body: 'Interpolating position and target independently causes the subject to swim. Quaternions for orientation, splines for position.',
    tags: ['motion', 'camera'],
  },
  {
    id: 'wgpu-fallback',
    title: 'Graceful WebGPU failure',
    body: 'Adapter request can resolve null even on supported hardware. Never assume the promise fulfills.',
    tags: ['webgpu', 'resilience'],
  },
]

export const sections: { id: SectionId; label: string; hint: string; kanji: string }[] = [
  { id: 'home', label: 'HUB', hint: 'Navigation Arc', kanji: '起点' },
  { id: 'works', label: 'WORKS', hint: 'Selected Works', kanji: '作品' },
  { id: 'about', label: 'ABOUT', hint: 'Transmission', kanji: '概要' },
  { id: 'lab', label: 'LAB', hint: 'Shader R&D', kanji: '実験' },
  { id: 'audio', label: 'AUDIO', hint: 'Sound Core', kanji: '音波' },
  { id: 'contact', label: 'CONTACT', hint: 'Direct Uplink', kanji: '通信' },
] as const
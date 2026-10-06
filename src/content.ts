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
  name: 'Sumit',
  handle: '@summmz',
  role: 'Full-Stack Developer // WebGPU & 3D Interactive',
  location: 'Remote',
  year: 2026,
  email: 'isumit7869@gmail.com',
  links: [
    { label: 'CONTACT', href: 'mailto:isumit7869@gmail.com' },
    { label: 'GITHUB', href: 'https://github.com/summmz' },
    { label: 'INSTAGRAM', href: 'https://www.instagram.com/summie.eee/' },
  ],
  bioEn: [
    'I’m a college student and full-stack developer who likes shipping real projects rather than endless tutorials. I work across the stack with JavaScript, TypeScript, React, Node.js and Express, backed by MongoDB and PostgreSQL.',
    'Beyond the backend I build WebGPU-powered 3D interactive sites and real-time web experiences — this very portfolio renders live WebGL/WebGPU scenes with a spatial audio core.',
    'Right now I’m deepening my backend fundamentals and system design while publicly building and deploying projects on GitHub and Vercel. Open to work and internships — my rule is simple: consistency beats motivation.',
  ],
  bioJa: [
    '大学生でありながら、実際に使われるフルスタックWebアプリを開発しています。JavaScript / TypeScript / React / Node.jsを軸に、MongoDBやPostgreSQLを組み合わせたモダンな構成でプロダクトを形にしています。',
    'バックエンドに加えて、WebGPUによる3DインタラクティブサイトやリアルタイムなWeb体験も構築しています。このポートフォリオ自体が、WebGL / WebGPUのライブシーンと空間オーディオで動作しています。',
    '現在はバックエンドの基礎とシステム設計を深めながら、GitHubやVercel上で公開してプロジェクトをビルド・デプロイしています。仕事の依頼やインターンシップも歓迎です。モットーは「一貫性はモチベーションに勝る」。',
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
    subtitle: 'FULL-STACK × WEBGPU',
    tagline: 'College student shipping real-world full-stack apps and WebGPU-powered 3D interactive sites — React, Node, and clean backends, in public.',
    metricLabel: 'STATUS',
    metricValue: 'OPEN TO WORK',
    tags: ['REACT', 'NODE.JS', 'WEBGPU', 'THREE.JS'],
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
    tagline: 'Open to work & internships — full-stack apps and WebGPU 3D interactive sites, built in public, one consistent push at a time.',
    metricLabel: 'STATUS',
    metricValue: 'AVAILABLE',
    tags: ['REMOTE', 'INTERNSHIPS', 'WEBGPU', '3D'],
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
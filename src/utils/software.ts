export interface SoftwareItem {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  color?: string;
  posX?: number;
  posY?: number;
  size?: number;
}

const PNG = (id: string) =>
  `/assets/software/images/png/${id}.png`;
export const WHITE_LOGO_IDS = new Set<string>([

]);
export const SOFTWARE_CATEGORIES = [
  { key: 'all',       label: 'Tous' },
  { key: 'dev',       label: 'Dev & Langages' },
  { key: 'design',    label: 'Design' },
  { key: 'database',  label: 'Bases de données' },
  { key: 'devops',    label: 'DevOps' },
  { key: 'cloud',     label: 'Cloud' },
  { key: 'ai',        label: 'IA / ML' },
  { key: 'game',      label: 'Moteurs de jeu' },
  { key: '3d',        label: '3D & VFX' },
  { key: 'video',     label: 'Vidéo' },
  { key: 'audio',     label: 'Audio & DAW' },
  { key: 'art',       label: 'Art & Illustration' },
  { key: 'collab',    label: 'Collaboration' },
  { key: 'cms',       label: 'CMS' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'office',    label: 'Office' },
  { key: 'security',  label: 'Sécurité' },
];

export const ALL_SOFTWARE: SoftwareItem[] = [

  // ── DESIGN ───────────────────────────────────────────────────────────────
  { id: 'photoshop',    name: 'Photoshop',          logoUrl: PNG('photoshop'),    category: 'design',   color: '#31A8FF' },
  { id: 'illustrator',  name: 'Illustrator',        logoUrl: PNG('illustrator'),  category: 'design',   color: '#FF9A00' },
  { id: 'xd',           name: 'Adobe XD',           logoUrl: PNG('xd'),           category: 'design',   color: '#FF61F6' },
  { id: 'indesign',     name: 'InDesign',           logoUrl: PNG('indesign'),     category: 'design',   color: '#EE3D8F' },
  { id: 'figma',        name: 'Figma',              logoUrl: PNG('figma'),        category: 'design',   color: '#F24E1E' },
  { id: 'sketch',       name: 'Sketch',             logoUrl: PNG('sketch'),       category: 'design',   color: '#FDB300' },
  { id: 'canva',        name: 'Canva',              logoUrl: PNG('canva'),        category: 'design',   color: '#00C4CC' },
  { id: 'framer',       name: 'Framer',             logoUrl: PNG('framer'),       category: 'design',   color: '#0055FF' },
  { id: 'zeplin',       name: 'Zeplin',             logoUrl: PNG('zeplin'),       category: 'design',   color: '#FDBD39' },
  { id: 'webflow',      name: 'Webflow',            logoUrl: PNG('webflow'),      category: 'design',   color: '#4353FF' },
  { id: 'affdesigner',  name: 'Affinity Designer',  logoUrl: PNG('affdesigner'),  category: 'design',   color: '#1B72BE' },
  { id: 'affphoto',     name: 'Affinity Photo',     logoUrl: PNG('affphoto'),     category: 'design',   color: '#4E3188' },

  // ── VIDÉO ─────────────────────────────────────────────────────────────────
  { id: 'premierepro',    name: 'Premiere Pro',    logoUrl: PNG('premierepro'),    category: 'video', color: '#9999FF' },
  { id: 'aftereffects',   name: 'After Effects',   logoUrl: PNG('aftereffects'),   category: 'video', color: '#9999FF' },
  { id: 'davinciresolve', name: 'DaVinci Resolve', logoUrl: PNG('davinciresolve'), category: 'video', color: '#233A51' },
  { id: 'finalcutpro',    name: 'Final Cut Pro',   logoUrl: PNG('finalcutpro'),    category: 'video', color: '#1C1C1E' },
  { id: 'handbrake',      name: 'HandBrake',       logoUrl: PNG('handbrake'),      category: 'video', color: '#E05B00' },
  { id: 'obs',            name: 'OBS Studio',      logoUrl: PNG('obs'),            category: 'video', color: '#302E31' },
  { id: 'vegas',          name: 'Vegas Pro',       logoUrl: PNG('vegas'),          category: 'video', color: '#CC0000' },

  // ── AUDIO ─────────────────────────────────────────────────────────────────
  { id: 'audacity',  name: 'Audacity',     logoUrl: PNG('audacity'),  category: 'audio', color: '#0000CC' },
  { id: 'flstudio',  name: 'FL Studio',    logoUrl: PNG('flstudio'),  category: 'audio', color: '#F7A800' },
  { id: 'ableton',   name: 'Ableton Live', logoUrl: PNG('ableton'),   category: 'audio', color: '#FFD700' },
  { id: 'logicpro',  name: 'Logic Pro',    logoUrl: PNG('logicpro'),  category: 'audio', color: '#007AFF' },
  { id: 'reaper',    name: 'REAPER',       logoUrl: PNG('reaper'),    category: 'audio', color: '#FF4F00' },
  { id: 'protools',  name: 'Pro Tools',    logoUrl: PNG('protools'),  category: 'audio', color: '#7ACB55' },
  { id: 'cubase',    name: 'Cubase',       logoUrl: PNG('cubase'),    category: 'audio', color: '#C2185B' },
  { id: 'lmms',      name: 'LMMS',         logoUrl: PNG('lmms'),      category: 'audio', color: '#04aa1a' },
  { id: 'nuendo',    name: 'Nuendo',       logoUrl: PNG('nuendo'),    category: 'audio', color: '#455A64' },

  // ── 3D & VFX ─────────────────────────────────────────────────────────────
  { id: 'blender',          name: 'Blender',            logoUrl: PNG('blender'),          category: '3d', color: '#F57900' },
  { id: 'maya',             name: 'Maya',               logoUrl: PNG('maya'),             category: '3d', color: '#00D8FF' },
  { id: 'cinema4d',         name: 'Cinema 4D',          logoUrl: PNG('cinema4d'),         category: '3d', color: '#011A6A' },
  { id: 'houdini',          name: 'Houdini',            logoUrl: PNG('houdini'),          category: '3d', color: '#FF4713' },
  { id: 'nuke',             name: 'Nuke',               logoUrl: PNG('nuke'),             category: '3d', color: '#efff0c' },
  { id: 'zbrush',           name: 'ZBrush',             logoUrl: PNG('zbrush'),           category: '3d', color: '#ffffff' },
  { id: '3dsmax',           name: '3ds Max',            logoUrl: PNG('3dsmax'),           category: '3d', color: '#00A4E4' },
  { id: 'substancepainter', name: 'Substance Painter',  logoUrl: PNG('substancepainter'), category: '3d', color: '#FF6B35' },
  { id: 'rhinoceros',       name: 'Rhinoceros 3D',      logoUrl: PNG('rhinoceros'),       category: '3d', color: '#888888' },
  { id: 'cascadeur',        name: 'Cascadeur',          logoUrl: PNG('cascadeur'),        category: '3d', color: '#2D7DD2' },
  { id: 'motionbuilder',    name: 'MotionBuilder',      logoUrl: PNG('motionbuilder'),    category: '3d', color: '#0078BE' },
  { id: 'marvellous',       name: 'Marvelous Designer', logoUrl: PNG('marvellous'),       category: '3d', color: '#E91E63' },
  { id: 'speedtree',        name: 'SpeedTree',          logoUrl: PNG('speedtree'),        category: '3d', color: '#4CAF50' },
  { id: 'wrap4d',           name: 'Wrap 4D',            logoUrl: PNG('wrap4d'),           category: '3d', color: '#607D8B' },

  // ── MOTEURS DE JEU ────────────────────────────────────────────────────────
  { id: 'unity',        name: 'Unity',        logoUrl: PNG('unity'),        category: 'game', color: '#FFFFFF' },
  { id: 'unrealengine', name: 'Unreal Engine',logoUrl: PNG('unreal-engine'), category: 'game', color: '#FFFFFF' },
  { id: 'godot',        name: 'Godot',        logoUrl: PNG('godot'),        category: 'game', color: '#478CBF' },
  { id: 'gamemaker',    name: 'GameMaker',    logoUrl: PNG('gamemaker'),    category: 'game', color: '#71B417' },
  { id: 'renpy',        name: "Ren'Py",       logoUrl: PNG('renpy'),        category: 'game', color: '#FF7F7F' },
  { id: 'rpgmaker',     name: 'RPG Maker',    logoUrl: PNG('rpgmaker'),     category: 'game', color: '#2196F3' },
  { id: 'construct',    name: 'Construct',    logoUrl: PNG('construct'),    category: 'game', color: '#00BCD4' },
  { id: 'defold',       name: 'Defold',       logoUrl: PNG('defold'),       category: 'game', color: '#FFD500' },
  { id: 'lumberyard',   name: 'O3DE',         logoUrl: PNG('lumberyard'),   category: 'game', color: '#1F70C1' },

  // ── DEV — ÉDITEURS & IDEs ──────────────────────────────────────────────
  { id: 'vscode',         name: 'VS Code',        logoUrl: PNG('vscode'),         category: 'dev', color: '#007ACC' },
  { id: 'intellij',       name: 'IntelliJ IDEA',  logoUrl: PNG('intellij'),       category: 'dev', color: '#FE315D' },
  { id: 'vim',            name: 'Vim',            logoUrl: PNG('vim'),            category: 'dev', color: '#019733' },
  { id: 'neovim',         name: 'Neovim',         logoUrl: PNG('neovim'),         category: 'dev', color: '#57A143' },
  { id: 'rider',          name: 'Rider',          logoUrl: PNG('rider'),          category: 'dev', color: '#C90E6F' },
  { id: 'clion',          name: 'CLion',          logoUrl: PNG('clion'),          category: 'dev', color: '#22D88F' },
  { id: 'webstorm',       name: 'WebStorm',       logoUrl: PNG('webstorm'),       category: 'dev', color: '#00CDD7' },
  { id: 'pycharm',        name: 'PyCharm',        logoUrl: PNG('pycharm'),        category: 'dev', color: '#21D789' },
  { id: 'androidstudio',  name: 'Android Studio', logoUrl: PNG('androidstudio'),  category: 'dev', color: '#3DDC84' },
  { id: 'xcode',          name: 'Xcode',          logoUrl: PNG('xcode'),          category: 'dev', color: '#1575F9' },
  { id: 'cursor',         name: 'Cursor',         logoUrl: PNG('cursor'),         category: 'dev', color: '#FFFFFF' },

  // ── DEV — LANGAGES ────────────────────────────────────────────────────────
  { id: 'javascript', name: 'JavaScript',  logoUrl: PNG('javascript'), category: 'dev', color: '#F7DF1E' },
  { id: 'typescript', name: 'TypeScript',  logoUrl: PNG('typescript'), category: 'dev', color: '#3178C6' },
  { id: 'python',     name: 'Python',      logoUrl: PNG('python'),     category: 'dev', color: '#3776AB' },
  { id: 'java',       name: 'Java',        logoUrl: PNG('java'),       category: 'dev', color: '#ED8B00' },
  { id: 'csharp',     name: 'C#',          logoUrl: PNG('csharp'),     category: 'dev', color: '#9B4F96' },
  { id: 'cplusplus',  name: 'C++',         logoUrl: PNG('cplusplus'),  category: 'dev', color: '#00599C' },
  { id: 'c',          name: 'C',           logoUrl: PNG('c'),          category: 'dev', color: '#A8B9CC' },
  { id: 'php',        name: 'PHP',         logoUrl: PNG('php'),        category: 'dev', color: '#777BB3' },
  { id: 'ruby',       name: 'Ruby',        logoUrl: PNG('ruby'),       category: 'dev', color: '#CC342D' },
  { id: 'swift',      name: 'Swift',       logoUrl: PNG('swift'),      category: 'dev', color: '#F05138' },
  { id: 'kotlin',     name: 'Kotlin',      logoUrl: PNG('kotlin'),     category: 'dev', color: '#7F52FF' },
  { id: 'go',         name: 'Go',          logoUrl: PNG('go'),         category: 'dev', color: '#00ADD8' },
  { id: 'rust',       name: 'Rust',        logoUrl: PNG('rust'),       category: 'dev', color: '#CE422B' },
  { id: 'scala',      name: 'Scala',       logoUrl: PNG('scala'),      category: 'dev', color: '#DC322F' },
  { id: 'dart',       name: 'Dart',        logoUrl: PNG('dart'),       category: 'dev', color: '#0175C2' },
  { id: 'html5',      name: 'HTML5',       logoUrl: PNG('html5'),      category: 'dev', color: '#E34F26' },
  { id: 'css3',       name: 'CSS3',        logoUrl: PNG('css3'),       category: 'dev', color: '#1572B6' },
  { id: 'bash',       name: 'Bash',        logoUrl: PNG('bash'),       category: 'dev', color: '#4EAA25' },
  { id: 'r',          name: 'R',           logoUrl: PNG('r'),          category: 'dev', color: '#276DC3' },
  { id: 'lua',        name: 'Lua',         logoUrl: PNG('lua'),        category: 'dev', color: '#2C2D72' },
  { id: 'elixir',     name: 'Elixir',      logoUrl: PNG('elixir'),     category: 'dev', color: '#4B275F' },
  { id: 'haskell',    name: 'Haskell',     logoUrl: PNG('haskell'),    category: 'dev', color: '#5D4F85' },
  { id: 'solidity',   name: 'Solidity',    logoUrl: PNG('solidity'),   category: 'dev', color: '#363636' },
  { id: 'zig',        name: 'Zig',         logoUrl: PNG('zig'),        category: 'dev', color: '#F7A41D' },
  { id: 'gleam',      name: 'Gleam',       logoUrl: PNG('gleam'),      category: 'dev', color: '#FFAFF3' },

  // ── DEV — FRAMEWORKS ──────────────────────────────────────────────────────
  { id: 'react',       name: 'React',        logoUrl: PNG('react'),       category: 'dev', color: '#61DAFB' },
  { id: 'nextjs',      name: 'Next.js',      logoUrl: PNG('nextjs'),      category: 'dev', color: '#FFFFFF' },
  { id: 'vuejs',       name: 'Vue.js',       logoUrl: PNG('vuejs'),       category: 'dev', color: '#4FC08D' },
  { id: 'nuxt',        name: 'Nuxt',         logoUrl: PNG('nuxt'),        category: 'dev', color: '#00DC82' },
  { id: 'angular',     name: 'Angular',      logoUrl: PNG('angular'),     category: 'dev', color: '#DD0031' },
  { id: 'svelte',      name: 'Svelte',       logoUrl: PNG('svelte'),      category: 'dev', color: '#FF3E00' },
  { id: 'sveltekit',   name: 'SvelteKit',    logoUrl: PNG('sveltekit'),   category: 'dev', color: '#FF3E00' },
  { id: 'flutter',     name: 'Flutter',      logoUrl: PNG('flutter'),     category: 'dev', color: '#54C5F8' },
  { id: 'nodejs',      name: 'Node.js',      logoUrl: PNG('nodejs'),      category: 'dev', color: '#539E43' },
  { id: 'express',     name: 'Express',      logoUrl: PNG('express'),     category: 'dev', color: '#FFFFFF' },
  { id: 'django',      name: 'Django',       logoUrl: PNG('django'),      category: 'dev', color: '#092E20' },
  { id: 'fastapi',     name: 'FastAPI',      logoUrl: PNG('fastapi'),     category: 'dev', color: '#009688' },
  { id: 'laravel',     name: 'Laravel',      logoUrl: PNG('laravel'),     category: 'dev', color: '#FF2D20' },
  { id: 'spring',      name: 'Spring',       logoUrl: PNG('spring'),      category: 'dev', color: '#6DB33F' },
  { id: 'nestjs',      name: 'NestJS',       logoUrl: PNG('nestjs'),      category: 'dev', color: '#E0234E' },
  { id: 'astro',       name: 'Astro',        logoUrl: PNG('astro'),       category: 'dev', color: '#FF5D01' },
  { id: 'remix',       name: 'Remix',        logoUrl: PNG('remix'),       category: 'dev', color: '#FFFFFF' },
  { id: 'solid',       name: 'SolidJS',      logoUrl: PNG('solid'),       category: 'dev', color: '#2C4F7C' },
  { id: 'graphql',     name: 'GraphQL',      logoUrl: PNG('graphql'),     category: 'dev', color: '#E10098' },
  { id: 'tailwindcss', name: 'Tailwind CSS', logoUrl: PNG('tailwindcss'), category: 'dev', color: '#38BDF8' },
  { id: 'prisma',      name: 'Prisma',       logoUrl: PNG('prisma'),      category: 'dev', color: '#2D3748' },
  { id: 'drizzle',     name: 'Drizzle ORM',  logoUrl: PNG('drizzle'),     category: 'dev', color: '#C5F74F' },
  { id: 'trpc',        name: 'tRPC',         logoUrl: PNG('trpc'),        category: 'dev', color: '#398CCB' },
  { id: 'tauri',       name: 'Tauri',        logoUrl: PNG('tauri'),       category: 'dev', color: '#FFC131' },
  { id: 'electron',    name: 'Electron',     logoUrl: PNG('electron'),    category: 'dev', color: '#47848F' },

  // ── GIT & DEVOPS ──────────────────────────────────────────────────────────
  { id: 'git',            name: 'Git',            logoUrl: PNG('git'),            category: 'dev',    color: '#F1502F' },
  { id: 'github',         name: 'GitHub',         logoUrl: PNG('github'),         category: 'dev',    color: '#FFFFFF' },
  { id: 'gitlab',         name: 'GitLab',         logoUrl: PNG('gitlab'),         category: 'devops', color: '#FC6D26' },
  { id: 'bitbucket',      name: 'Bitbucket',      logoUrl: PNG('bitbucket'),      category: 'devops', color: '#0052CC' },
  { id: 'docker',         name: 'Docker',         logoUrl: PNG('docker'),         category: 'devops', color: '#2496ED' },
  { id: 'kubernetes',     name: 'Kubernetes',     logoUrl: PNG('kubernetes'),     category: 'devops', color: '#326CE5' },
  { id: 'jenkins',        name: 'Jenkins',        logoUrl: PNG('jenkins'),        category: 'devops', color: '#D33833' },
  { id: 'nginx',          name: 'Nginx',          logoUrl: PNG('nginx'),          category: 'devops', color: '#009900' },
  { id: 'linux',          name: 'Linux',          logoUrl: PNG('linux'),          category: 'devops', color: '#FCC624' },
  { id: 'ansible',        name: 'Ansible',        logoUrl: PNG('ansible'),        category: 'devops', color: '#EE0000' },
  { id: 'terraform',      name: 'Terraform',      logoUrl: PNG('terraform'),      category: 'devops', color: '#7B42BC' },
  { id: 'githubactions',  name: 'GitHub Actions', logoUrl: PNG('githubactions'),  category: 'devops', color: '#2088FF' },
  { id: 'circleci',       name: 'CircleCI',       logoUrl: PNG('circleci'),       category: 'devops', color: '#343434' },
  { id: 'travisci',       name: 'Travis CI',      logoUrl: PNG('travisci'),       category: 'devops', color: '#3EAAAF' },
  { id: 'packer',         name: 'Packer',         logoUrl: PNG('packer'),         category: 'devops', color: '#02A8EF' },
  { id: 'pulumi',         name: 'Pulumi',         logoUrl: PNG('pulumi'),         category: 'devops', color: '#8A3391' },

  // ── CLOUD ─────────────────────────────────────────────────────────────────
  { id: 'aws',          name: 'AWS',          logoUrl: PNG('aws'),          category: 'cloud', color: '#FF9900' },
  { id: 'azure',        name: 'Azure',        logoUrl: PNG('azure'),        category: 'cloud', color: '#0078D4' },
  { id: 'googlecloud',  name: 'Google Cloud', logoUrl: PNG('googlecloud'),  category: 'cloud', color: '#4285F4' },
  { id: 'vercel',       name: 'Vercel',       logoUrl: PNG('vercel'),       category: 'cloud', color: '#FFFFFF' },
  { id: 'netlify',      name: 'Netlify',      logoUrl: PNG('netlify'),      category: 'cloud', color: '#00C7B7' },
  { id: 'cloudflare',   name: 'Cloudflare',   logoUrl: PNG('cloudflare'),   category: 'cloud', color: '#F38020' },
  { id: 'digitalocean', name: 'DigitalOcean', logoUrl: PNG('digitalocean'), category: 'cloud', color: '#0080FF' },
  { id: 'railway',      name: 'Railway',      logoUrl: PNG('railway'),      category: 'cloud', color: '#0B0D0E' },
  { id: 'fly',          name: 'Fly.io',       logoUrl: PNG('fly'),          category: 'cloud', color: '#7B3FE4' },
  { id: 'render',       name: 'Render',       logoUrl: PNG('render'),       category: 'cloud', color: '#46E3B7' },

  // ── BASES DE DONNÉES ──────────────────────────────────────────────────────
  { id: 'mysql',         name: 'MySQL',         logoUrl: PNG('mysql'),         category: 'database', color: '#4479A1' },
  { id: 'postgresql',    name: 'PostgreSQL',    logoUrl: PNG('postgresql'),    category: 'database', color: '#336791' },
  { id: 'mongodb',       name: 'MongoDB',       logoUrl: PNG('mongodb'),       category: 'database', color: '#47A248' },
  { id: 'redis',         name: 'Redis',         logoUrl: PNG('redis'),         category: 'database', color: '#DC382D' },
  { id: 'sqlite',        name: 'SQLite',        logoUrl: PNG('sqlite'),        category: 'database', color: '#003B57' },
  { id: 'firebase',      name: 'Firebase',      logoUrl: PNG('firebase'),      category: 'database', color: '#FFCA28' },
  { id: 'supabase',      name: 'Supabase',      logoUrl: PNG('supabase'),      category: 'database', color: '#3ECF8E' },
  { id: 'elasticsearch', name: 'Elasticsearch', logoUrl: PNG('elasticsearch'), category: 'database', color: '#FEC514' },
  { id: 'turso',         name: 'Turso',         logoUrl: PNG('turso'),         category: 'database', color: '#4FF8D2' },
  { id: 'neon',          name: 'Neon DB',       logoUrl: PNG('neon'),          category: 'database', color: '#00E5BF' },
  { id: 'planetscale',   name: 'PlanetScale',   logoUrl: PNG('planetscale'),   category: 'database', color: '#FFFFFF' },
  { id: 'cassandra',     name: 'Cassandra',     logoUrl: PNG('cassandra'),     category: 'database', color: '#1287B1' },

  // ── IA / ML ───────────────────────────────────────────────────────────────
  { id: 'tensorflow',  name: 'TensorFlow',   logoUrl: PNG('tensorflow'),  category: 'ai', color: '#FF6F00' },
  { id: 'pytorch',     name: 'PyTorch',      logoUrl: PNG('pytorch'),     category: 'ai', color: '#EE4C2C' },
  { id: 'scikitlearn', name: 'scikit-learn', logoUrl: PNG('scikitlearn'), category: 'ai', color: '#F7931E' },
  { id: 'opencv',      name: 'OpenCV',       logoUrl: PNG('opencv'),      category: 'ai', color: '#5C3EE8' },
  { id: 'jupyter',     name: 'Jupyter',      logoUrl: PNG('jupyter'),     category: 'ai', color: '#F37626' },
  { id: 'numpy',       name: 'NumPy',        logoUrl: PNG('numpy'),       category: 'ai', color: '#4DABCF' },
  { id: 'pandas',      name: 'Pandas',       logoUrl: PNG('pandas'),      category: 'ai', color: '#150458' },
  { id: 'huggingface', name: 'Hugging Face', logoUrl: PNG('huggingface'), category: 'ai', color: '#FFD21E' },
  { id: 'ollama',      name: 'Ollama',       logoUrl: PNG('ollama'),      category: 'ai', color: '#FFFFFF' },
  { id: 'openai',      name: 'OpenAI',       logoUrl: PNG('openai'),      category: 'ai', color: '#FFFFFF' },
  { id: 'langchain',   name: 'LangChain',    logoUrl: PNG('langchain'),   category: 'ai', color: '#1C3C3C' },

  // ── COLLABORATION ─────────────────────────────────────────────────────────
  { id: 'slack',      name: 'Slack',      logoUrl: PNG('slack'),      category: 'collab', color: '#4A154B' },
  { id: 'jira',       name: 'Jira',       logoUrl: PNG('jira'),       category: 'collab', color: '#0052CC' },
  { id: 'confluence', name: 'Confluence', logoUrl: PNG('confluence'), category: 'collab', color: '#172B4D' },
  { id: 'trello',     name: 'Trello',     logoUrl: PNG('trello'),     category: 'collab', color: '#0079BF' },
  { id: 'discord',    name: 'Discord',    logoUrl: PNG('discord'),    category: 'collab', color: '#5865F2' },
  { id: 'linear',     name: 'Linear',     logoUrl: PNG('linear'),     category: 'collab', color: '#5E6AD2' },
  { id: 'asana',      name: 'Asana',      logoUrl: PNG('asana'),      category: 'collab', color: '#F06A6A' },

  // ── CMS ───────────────────────────────────────────────────────────────────
  { id: 'wordpress',  name: 'WordPress',  logoUrl: PNG('wordpress'),  category: 'cms', color: '#21759B' },
  { id: 'strapi',     name: 'Strapi',     logoUrl: PNG('strapi'),     category: 'cms', color: '#4945FF' },
  { id: 'sanity',     name: 'Sanity',     logoUrl: PNG('sanity'),     category: 'cms', color: '#F36458' },
  { id: 'contentful', name: 'Contentful', logoUrl: PNG('contentful'), category: 'cms', color: '#2478CC' },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  { id: 'grafana',         name: 'Grafana',          logoUrl: PNG('grafana'),         category: 'analytics', color: '#F46800' },
  { id: 'prometheus',      name: 'Prometheus',       logoUrl: PNG('prometheus'),      category: 'analytics', color: '#E6522C' },
  { id: 'googleanalytics', name: 'Google Analytics', logoUrl: PNG('googleanalytics'), category: 'analytics', color: '#E37400' },
  { id: 'posthog',         name: 'PostHog',          logoUrl: PNG('posthog'),         category: 'analytics', color: '#F54E00' },

  // ── OFFICE ────────────────────────────────────────────────────────────────
  { id: 'notion',   name: 'Notion',        logoUrl: PNG('notion'),   category: 'office', color: '#FFFFFF' },
  { id: 'obsidian', name: 'Obsidian',      logoUrl: PNG('obsidian'), category: 'office', color: '#7C3AED' },
  { id: 'airtable', name: 'Airtable',      logoUrl: PNG('airtable'), category: 'office', color: '#18BFFF' },
  { id: 'msoffice', name: 'Microsoft 365', logoUrl: PNG('msoffice'), category: 'office', color: '#D83B01' },

  // ── ART & ILLUSTRATION ────────────────────────────────────────────────────
  { id: 'gimp',      name: 'GIMP',              logoUrl: PNG('gimp'),      category: 'art', color: '#5C5543' },
  { id: 'inkscape',  name: 'Inkscape',          logoUrl: PNG('inkscape'),  category: 'art', color: '#000000' },
  { id: 'krita',     name: 'Krita',             logoUrl: PNG('krita'),     category: 'art', color: '#3BABFF' },
  { id: 'procreate', name: 'Procreate',         logoUrl: PNG('procreate'), category: 'art', color: '#FFFFFF' },
  { id: 'clip',      name: 'Clip Studio Paint', logoUrl: PNG('clip'),      category: 'art', color: '#CFE566' },

  // ── SÉCURITÉ ─────────────────────────────────────────────────────────────
  { id: 'wireshark',  name: 'Wireshark',       logoUrl: PNG('wireshark'),  category: 'security', color: '#1679A7' },
  { id: 'kalilinux',  name: 'Kali Linux',      logoUrl: PNG('kalilinux'),  category: 'security', color: '#557C94' },
  { id: 'burpsuite',  name: 'Burp Suite',      logoUrl: PNG('burpsuite'),  category: 'security', color: '#FF6633' },
  { id: 'metasploit', name: 'Metasploit',      logoUrl: PNG('metasploit'), category: 'security', color: '#2596CD' },
  { id: 'vault',      name: 'HashiCorp Vault', logoUrl: PNG('vault'),      category: 'security', color: '#FFEC6E' },
];
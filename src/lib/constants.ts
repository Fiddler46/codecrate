import type { Crate } from './types'

export interface LanguageMeta {
  id: string
  label: string
  short: string
  extension: string
  colorVar: string
  shiki: string
}

export const LANGUAGES: LanguageMeta[] = [
  { id: 'javascript', label: 'JavaScript', short: 'JS', extension: 'js', colorVar: '--lang-javascript', shiki: 'javascript' },
  { id: 'typescript', label: 'TypeScript', short: 'TS', extension: 'ts', colorVar: '--lang-typescript', shiki: 'typescript' },
  { id: 'tsx', label: 'React / TSX', short: 'TSX', extension: 'tsx', colorVar: '--lang-tsx', shiki: 'tsx' },
  { id: 'python', label: 'Python', short: 'PY', extension: 'py', colorVar: '--lang-python', shiki: 'python' },
  { id: 'go', label: 'Go / Golang', short: 'GO', extension: 'go', colorVar: '--lang-go', shiki: 'go' },
  { id: 'rust', label: 'Rust', short: 'RS', extension: 'rs', colorVar: '--lang-rust', shiki: 'rust' },
  { id: 'sql', label: 'SQL', short: 'SQL', extension: 'sql', colorVar: '--lang-sql', shiki: 'sql' },
  { id: 'css', label: 'CSS', short: 'CSS', extension: 'css', colorVar: '--lang-css', shiki: 'css' },
  { id: 'html', label: 'HTML', short: 'HTML', extension: 'html', colorVar: '--lang-html', shiki: 'html' },
  { id: 'json', label: 'JSON', short: 'JSON', extension: 'json', colorVar: '--lang-json', shiki: 'json' },
  { id: 'yaml', label: 'YAML', short: 'YAML', extension: 'yml', colorVar: '--lang-yaml', shiki: 'yaml' },
  { id: 'bash', label: 'Shell / Bash', short: 'SH', extension: 'sh', colorVar: '--lang-bash', shiki: 'bash' },
  { id: 'markdown', label: 'Markdown', short: 'MD', extension: 'md', colorVar: '--lang-markdown', shiki: 'markdown' },
  { id: 'java', label: 'Java', short: 'JAVA', extension: 'java', colorVar: '--lang-java', shiki: 'java' },
  { id: 'cpp', label: 'C / C++', short: 'C++', extension: 'cpp', colorVar: '--lang-cpp', shiki: 'cpp' },
]

export const LANGUAGE_MAP: Record<string, LanguageMeta> = Object.fromEntries(
  LANGUAGES.map((language) => [language.id, language])
)

export const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  jsx: 'tsx',
  py: 'python',
  golang: 'go',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  c: 'cpp',
  'c++': 'cpp',
  cs: 'java',
}

export const FALLBACK_LANGUAGE: LanguageMeta = {
  id: 'plaintext',
  label: 'Plain Text',
  short: 'TXT',
  extension: 'txt',
  colorVar: '--lang-markdown',
  shiki: 'plaintext',
}

export const DEFAULT_CRATES: Crate[] = [
  { id: 'personal-vault', name: 'Personal Vault', icon: 'lock' },
  { id: 'frontend-ui', name: 'Frontend UI', icon: 'grid' },
  { id: 'node-backend', name: 'Node Backend', icon: 'server' },
  { id: 'devops-scripts', name: 'DevOps & Scripts', icon: 'terminal' },
]

export const TAG_SUGGESTIONS = [
  'react',
  'node',
  'async',
  'api',
  'auth',
  'typescript',
  'database',
  'hooks',
  'devops',
  'testing',
  'config',
  'performance',
]

export const PAGE_SIZE = 9
export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
export const LOCAL_STORAGE_BUDGET = 5 * 1024 * 1024

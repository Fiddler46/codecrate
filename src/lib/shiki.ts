import { createHighlighter, type BundledLanguage, type Highlighter, type ThemeRegistration } from 'shiki'
import { LANGUAGES } from './constants'
import type { ThemeMode } from './types'

const vaultDarkTheme: ThemeRegistration = {
  name: 'vault-dark',
  type: 'dark',
  colors: {
    'editor.background': '#070A10',
    'editor.foreground': '#DAE2FD',
  },
  settings: [
    { settings: { foreground: '#DAE2FD', background: '#070A10' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#64748B', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#4CD7F6' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'constant.other.symbol'],
      settings: { foreground: '#FFC174' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.character.escape'],
      settings: { foreground: '#FFB95F' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#56E5A9' },
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type', 'entity.other.inherited-class'],
      settings: { foreground: '#7DD3FC' },
    },
    {
      scope: ['variable', 'variable.other', 'meta.object-literal.key', 'support.type.property-name'],
      settings: { foreground: '#DAE2FD' },
    },
    {
      scope: ['entity.name.tag', 'entity.other.attribute-name'],
      settings: { foreground: '#F59E0B' },
    },
    { scope: ['keyword.operator'], settings: { foreground: '#A08E7A' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#8FA3BF' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#FFB4AB' } },
    { scope: ['markup.heading'], settings: { foreground: '#FFC174', fontStyle: 'bold' } },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.inline.raw', 'markup.raw'], settings: { foreground: '#56E5A9' } },
    { scope: ['entity.name.section', 'entity.name.namespace'], settings: { foreground: '#7DD3FC' } },
  ],
}

const vaultLightTheme: ThemeRegistration = {
  name: 'vault-light',
  type: 'light',
  colors: {
    'editor.background': '#F8FAFC',
    'editor.foreground': '#0F172A',
  },
  settings: [
    { settings: { foreground: '#0F172A', background: '#F8FAFC' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#64748B', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#B45309' },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'constant.other.symbol'],
      settings: { foreground: '#C2410C' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.character.escape'],
      settings: { foreground: '#B45309' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#0E7490' },
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type', 'entity.other.inherited-class'],
      settings: { foreground: '#0369A1' },
    },
    {
      scope: ['variable', 'variable.other', 'meta.object-literal.key', 'support.type.property-name'],
      settings: { foreground: '#0F172A' },
    },
    {
      scope: ['entity.name.tag', 'entity.other.attribute-name'],
      settings: { foreground: '#B45309' },
    },
    { scope: ['keyword.operator'], settings: { foreground: '#475569' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#475569' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#B91C1C' } },
    { scope: ['markup.heading'], settings: { foreground: '#B45309', fontStyle: 'bold' } },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.inline.raw', 'markup.raw'], settings: { foreground: '#047857' } },
    { scope: ['entity.name.section', 'entity.name.namespace'], settings: { foreground: '#0369A1' } },
  ],
}

const SHIKI_LANGUAGES = LANGUAGES.map((language) => language.shiki) as BundledLanguage[]

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [vaultDarkTheme, vaultLightTheme],
      langs: SHIKI_LANGUAGES,
    }).catch((error) => {
      highlighterPromise = null
      throw error
    })
  }

  return highlighterPromise
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function plainCodeHtml(value: string): string {
  // No separators between line spans: block-level spans plus `white-space: pre`
  // would render each stray newline as an empty row and misalign the overlay.
  const lines = value
    .split('\n')
    .map((line) => `<span class="line">${escapeHtml(line)}</span>`)
    .join('')
  return `<pre class="shiki"><code>${lines}</code></pre>`
}

/**
 * Shiki emits a bare newline between each block-level `.line` span. With
 * `white-space: pre` those text nodes render as empty rows, so the highlight
 * layer drifts out of sync with the textarea overlay (typed text and caret on
 * a different row than the colored line). Newlines cannot appear as literal
 * `<span class="line"` inside token text because content is escaped, so this
 * replace is unambiguous.
 */
export function compactLineHtml(html: string): string {
  return html.replace(/\n(?=<span class="line")/g, '')
}

export function highlightCode(
  highlighter: Highlighter | null,
  code: string,
  language: string,
  theme: ThemeMode
): string {
  if (!highlighter) return plainCodeHtml(code)

  try {
    const html = highlighter.codeToHtml(code, {
      lang: language,
      theme: theme === 'dark' ? 'vault-dark' : 'vault-light',
    })
    return compactLineHtml(html)
  } catch {
    return plainCodeHtml(code)
  }
}

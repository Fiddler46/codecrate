'use client'

import { useState } from 'react'
import { createClient } from '../../../lib/supabase-browser'
import { Icon } from '../../components/ui/Icon'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../lib/use-theme'

export default function LoginPage() {
  const { toggle: toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGitHubLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (signInError) throw signInError
    } catch (loginError) {
      console.error('Error logging in:', loginError)
      setError('GitHub sign-in could not start. Check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="box" size={19} strokeWidth={1.9} />
          </span>
          <div>
            <div className="login-wordmark">CodeCrate</div>
          </div>
        </div>

        <ThemeToggle onToggle={toggleTheme} />
      </header>

      <main className="login-main">
        <section className="login-panel">
          <div className="login-story">
            <h1 className="login-title">
              Your code,
              <br />
              <em>recycled</em> for reuse.
            </h1>

            <p className="login-lede">
              CodeCrate is a private, searchable vault for the snippets you reach for every
              day.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <span className="login-feature-icon">
                  <Icon name="search" size={14} />
                </span>
                <div>
                  <strong>Search like a terminal</strong>
                  <span>Filter by language, tag, or crate with lang:, tag:, and crate: tokens.</span>
                </div>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <Icon name="star" size={14} />
                </span>
                <div>
                  <strong>Keep favorites close</strong>
                  <span>Star, annotate, and organize reusable code into custom crates.</span>
                </div>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <Icon name="code" size={14} />
                </span>
                <div>
                  <strong>Copy without friction</strong>
                  <span>Syntax-highlighted chambers with one-click copy.</span>
                </div>
              </div>
            </div>

            {/* <div className="login-sample" aria-hidden="true">
              <div className="login-sample-head">
                <span className="login-sample-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>vault/retry-wrapper.ts</span>
              </div>
              <pre>
                {'export const '}
                <span className="tok-fn">retry</span>
                {' = async <T>(fn: () => '}
                <span className="tok-type">Promise</span>
                {'<T>, tries = '}
                <span className="tok-num">3</span>
                {') => {\n'}
                {'  for (let i = 0; i < tries; i++) {\n'}
                {'    try { return await fn() }\n'}
                {'    catch (err) { if (i === tries - 1) throw err }\n'}
                {'  }\n'}
                {'}'}
              </pre>
            </div> */}
          </div>

          <div className="login-card">

            <h2 className="login-card-title">Open your vault</h2>
            <p className="login-card-text">
              Sign in with GitHub to load your snippet index. Your workbench picks up exactly
              where you left it.
            </p>

            {error && (
              <div className="login-error" role="alert">
                <Icon name="alert" size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="github-btn"
              onClick={() => void handleGitHubLogin()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-light" />
                  Contacting GitHub...
                </>
              ) : (
                <>
                  <Icon name="github" size={17} />
                  Continue with GitHub
                </>
              )}
            </button>

            <div className="login-divider">
              <span>private by default</span>
            </div>

            <ul className="login-notes">
              <li>
                <Icon name="lock" size={13} />
                <span>Your snippets stay tied to your account and are only visible to you.</span>
              </li>
              <li>
                <Icon name="database" size={13} />
                <span>Favorites, crates, and notes are stored safely in the cloud.</span>
              </li>
            </ul>

            <p className="login-fineprint">
              CodeCrate keeps the vault easy and the code reusable. No newsletters, no
              telemetry, no rewriting the same helper twice.
            </p>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <span>CodeCrate · V1.0</span>
        <span>Built for devs who hate rewriting the same thing twice.</span>
      </footer>
    </div>
  )
}

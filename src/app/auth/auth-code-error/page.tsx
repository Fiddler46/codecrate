import Link from 'next/link'
import { Icon } from '../../../components/ui/Icon'

type AuthCodeErrorProps = {
  searchParams: Promise<{
    description?: string
  }>
}

export default async function AuthCodeErrorPage({ searchParams }: AuthCodeErrorProps) {
  const { description: raw } = await searchParams
  const description = raw ?? null

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="box" size={19} strokeWidth={1.9} />
          </span>
          <div>
            <div className="login-wordmark">CodeCrate</div>
            {/* <div className="login-brand-meta">machined snippet vault</div> */}
          </div>
        </div>
      </header>

      <main className="login-main">
        <section className="login-panel">
          <div className="login-story">
            <div className="login-card auth-error-card">
              <span className="login-kicker">
                <span className="field-dot is-red" />
                Sign-in interrupted
              </span>

              <h2 className="login-card-title">The login handshake failed</h2>
              <p className="login-card-text">
                GitHub could not hand your session back to CodeCrate. Common causes:

                the Supabase publishable key in <code>.env</code> is stale or was not copied
                in full, the GitHub provider is disabled, or{' '}
                <code>http://localhost:3000/api/auth/callback</code> is missing from the
                vault&apos;s allowed redirect URLs.
              </p>

              {description && (
                <div className="login-error auth-error-details" role="alert">
                  <Icon name="alert" size={14} />
                  <span>{description}</span>
                </div>
              )}

              <Link href="/login" className="github-btn auth-error-btn">
                <Icon name="github" size={16} />
                Back to sign-in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


import { createClient } from '../../../../../lib/auth';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const sendToErrorPage = (message: string) =>
    NextResponse.redirect(
      `${origin}/auth/auth-code-error?description=${encodeURIComponent(message)}`
    )

  // Forward any error details Supabase appended to the redirect URL.
  const upstreamError = searchParams.get('error')
  if (upstreamError) {
    const description =
      searchParams.get('error_description') ?? searchParams.get('error_code') ?? upstreamError
    return sendToErrorPage(`${upstreamError}: ${description}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    return sendToErrorPage(error.message)
  }

  return sendToErrorPage('The authorization link did not include a code parameter.')
}

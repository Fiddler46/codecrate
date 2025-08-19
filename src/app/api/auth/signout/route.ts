
import { createClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()

  await supabase.auth.signOut()

  return NextResponse.redirect(`${requestUrl.origin}/login`)
}

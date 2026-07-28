import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/auth'
import { redis, CACHE_KEYS } from '../../../../../lib/redis'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // Invalidate all caches for this user
    const keys = await redis.keys(`search:${user.id}:*`)
    if (keys.length > 0) await redis.del(...keys)
    await redis.del(CACHE_KEYS.USER_SNIPPETS(user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting snippet:', error)
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, content, language, tags } = await request.json()

    const { data, error } = await supabase
      .from('snippets')
      .update({ title, content, language, tags })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Invalidate all caches for this user
    const keys = await redis.keys(`search:${user.id}:*`)
    if (keys.length > 0) await redis.del(...keys)
    await redis.del(CACHE_KEYS.USER_SNIPPETS(user.id))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating snippet:', error)
    return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 })
  }
}
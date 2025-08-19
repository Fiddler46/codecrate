
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth'
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  try {
    let snippets

    if (search) {
      // Check cache for search results
      const cacheKey = CACHE_KEYS.SNIPPET_SEARCH(user.id, search)
      const cachedResults = await redis.get(cacheKey)
      
      if (cachedResults) {
        return NextResponse.json(JSON.parse(cachedResults))
      }

      // Search snippets by title or tags
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .or(`title.ilike.%${search}%,tags.cs.{${search}}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      snippets = data
      // Cache search results
      await redis.setex(cacheKey, CACHE_TTL.SEARCH_RESULTS, JSON.stringify(snippets))
    } else {
      // Check cache for user snippets
      const cacheKey = CACHE_KEYS.USER_SNIPPETS(user.id)
      const cachedSnippets = await redis.get(cacheKey)
      
      if (cachedSnippets) {
        return NextResponse.json(JSON.parse(cachedSnippets))
      }

      // Get all user snippets
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      snippets = data
      // Cache user snippets
      await redis.setex(cacheKey, CACHE_TTL.USER_SNIPPETS, JSON.stringify(snippets))
    }

    return NextResponse.json(snippets)
  } catch (error) {
    console.error('Error fetching snippets:', error)
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, content, language, tags } = await request.json()

    const { data, error } = await supabase
      .from('snippets')
      .insert([
        {
          title,
          content,
          language,
          tags,
          user_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    await redis.del(CACHE_KEYS.USER_SNIPPETS(user.id))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating snippet:', error)
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 })
  }
}

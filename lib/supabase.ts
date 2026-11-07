
import { createClient } from '@supabase/supabase-js'

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export const supabase = createClient(supabaseUrl!, supabaseKey!)

export type Database = {
  public: {
    Tables: {
      snippets: {
        Row: {
          id: string
          title: string
          content: string
          language: string
          tags: string[]
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          language: string
          tags: string[]
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          language?: string
          tags?: string[]
          created_at?: string
          user_id?: string
        }
      }
    }
  }
}

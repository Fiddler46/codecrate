# CodeCrate

A private, searchable workbench for the code you reuse — file snippets into crates, tag them, and copy them back out in seconds. Built with **Next.js 15 (App Router)**, **Supabase**, and **Upstash Redis**.

## Features

- **GitHub authentication** via Supabase (PKCE OAuth with cookie-based sessions)
- **Snippet studio** — create, edit, duplicate, and delete snippets with language-aware syntax highlighting (Shiki, custom vault themes for light and dark mode)
- **Vault organization** — favorites, recent, archive views, custom crates/collections, descriptions, versions, and copy-count tracking (stored locally per user)
- **Terminal-style search** — `lang:`, `tag:`, and `crate:` filter tokens, language/tag filter menus, sorting, and grid/dense layout toggles
- **Bulk actions** — select-all, bulk archive/restore, bulk delete, and JSON export
- **Upstash Redis caching** — 5-minute list cache and 10-minute search cache, invalidated on every write; degrades gracefully to no-cache when Redis isn't configured
- **Light & dark themes** — Pretty self explanatory :P

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) An [Upstash](https://upstash.com/redis) Redis database for caching

### Environment Variables

Create a `.env` file in the root directory (already gitignored) with:

```env
# Supabase — safe to expose to the browser (RLS-governed)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Server-only secret key — only needed for admin/RLS-bypass operations
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SECRET_KEY=sb_secret_...

# Redis via Upstash (optional — leave unset to run without caching)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com), then in **Settings → API Keys** copy the project URL and publishable key into `.env`.
2. In the SQL Editor, create the snippets table:

```sql
create table snippets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  language text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Enable Row Level Security
alter table snippets enable row level security;

-- Policies: users can only touch their own snippets
create policy "Users can view their own snippets" on snippets
  for select using (auth.uid() = user_id);

create policy "Users can insert their own snippets" on snippets
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own snippets" on snippets
  for update using (auth.uid() = user_id);

create policy "Users can delete their own snippets" on snippets
  for delete using (auth.uid() = user_id);
```

3. Enable GitHub authentication under **Authentication → Providers** with your GitHub OAuth app credentials. The GitHub app's callback URL must be `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Under **Authentication → URL Configuration**, allow `http://localhost:3000/api/auth/callback` for local development

### Redis Setup (Optional)

1. Create a free [Upstash Redis](https://upstash.com/redis) database (any region close to you, enable eviction so the cache degrades gracefully at the size cap).
2. Copy the REST URL and token into `.env`.

Without these variables the app still works, the cache layer just becomes a pass-through. If Redis is configured but unavailable, requests fall back to Supabase instead of failing.

### Installation & Development

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm run start`, `npm run lint`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase API Keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [Shiki Documentation](https://shiki.style)

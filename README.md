
# CodeCrate

A bookmarking tool for developers to save code snippets with tags and titles. Built with Next.js, Supabase, and Redis.

## Features

- GitHub authentication via Supabase
- Save code snippets with titles, languages, and tags
- Search through snippets by title or tags
- Redis caching for improved performance

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis Configuration (optional - defaults to localhost)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, go to SQL Editor and run this SQL to create the snippets table:

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

-- Create policy so users can only see their own snippets
create policy "Users can view their own snippets" on snippets
  for select using (auth.uid() = user_id);

create policy "Users can insert their own snippets" on snippets
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own snippets" on snippets
  for update using (auth.uid() = user_id);

create policy "Users can delete their own snippets" on snippets
  for delete using (auth.uid() = user_id);
```

3. Enable GitHub authentication in Supabase:
   - Go to Authentication > Settings
   - Configure GitHub OAuth with your GitHub app credentials

### Redis Setup

For Redis, you can either:
- Run Redis locally: `redis-server`
- Use a cloud Redis service like Redis Cloud or Upstash
- For development, Redis is optional (the app will work without caching)

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Redis Documentation](https://redis.io/docs)

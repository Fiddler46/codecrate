# CodeCrate

## Overview

CodeCrate is a bookmarking tool designed for developers to save, organize, and search through code snippets. The application provides GitHub-based authentication and allows users to store code snippets with metadata including titles, programming languages, and tags. Built with a modern Next.js architecture, it features syntax highlighting, real-time search capabilities, and performance optimization through Redis caching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses Next.js 15 with React 19 and TypeScript, implementing the App Router architecture. The frontend is built as a client-side rendered application with server-side components for authentication and data fetching. Styling is handled through Tailwind CSS v4 with custom configurations for code syntax highlighting.

Key architectural decisions:
- **Next.js App Router**: Chosen for its file-based routing system and built-in API routes, providing a streamlined development experience
- **Client-side rendering**: Main pages use 'use client' directive to enable interactive features like real-time search and code editing
- **Shiki integration**: Implements syntax highlighting for code snippets with support for multiple programming languages and themes

### Backend Architecture
The backend leverages Next.js API routes for serverless functions, providing RESTful endpoints for snippet management. Authentication middleware protects routes and ensures user session management across the application.

Core components:
- **API Routes**: RESTful endpoints for CRUD operations on code snippets
- **Middleware**: Supabase-based authentication middleware that redirects unauthenticated users
- **Server-side clients**: Separate Supabase clients for server-side operations and browser-side interactions

### Authentication System
Authentication is handled entirely through Supabase Auth with GitHub OAuth integration. The system implements Row Level Security (RLS) to ensure users can only access their own snippets.

Security features:
- **OAuth Integration**: GitHub-based authentication for seamless developer onboarding
- **Session Management**: Cookie-based sessions managed through Supabase SSR
- **Row Level Security**: Database-level security ensuring data isolation between users

### Data Storage
The application uses Supabase (PostgreSQL) as the primary database with Redis for caching frequently accessed data. The database schema is designed for efficient querying and supports full-text search on snippet titles and tag arrays.

Database design:
- **Snippets Table**: Stores code snippets with metadata including title, content, language, tags, and user association
- **User Isolation**: Foreign key relationship to Supabase Auth users with cascading delete
- **Search Optimization**: Supports PostgreSQL's full-text search and array operations for tag matching

### Caching Strategy
Redis caching is implemented to improve performance for frequently accessed data, with different TTL values based on data volatility.

Caching approach:
- **User Snippets**: 5-minute TTL for personal snippet collections
- **Search Results**: 10-minute TTL for search query results
- **Cache Invalidation**: Manual invalidation on data mutations to maintain consistency

## External Dependencies

### Core Services
- **Supabase**: PostgreSQL database with built-in authentication, real-time subscriptions, and Row Level Security
- **Redis**: In-memory caching for performance optimization of search results and user data
- **GitHub OAuth**: Authentication provider integrated through Supabase Auth

### Development Tools
- **Shiki**: Syntax highlighting library for code snippets with extensive language support
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TypeScript**: Static type checking for improved development experience

### Hosting Dependencies
- **Next.js**: Full-stack React framework providing both frontend and serverless backend capabilities
- **Vercel/Platform Deployment**: Designed for serverless deployment environments
- **Environment Variables**: Configuration management for API keys, database URLs, and Redis connection strings
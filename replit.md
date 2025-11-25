# BibleChorus - Scripture-Based Music Platform

## Overview

BibleChorus is a Next.js-based web application that enables users to upload, discover, and engage with Bible-based music and study materials. The platform combines music streaming, community discussion, and progress tracking to create a comprehensive scripture learning experience.

The application features:
- **Music Library**: Upload and listen to songs with Bible verse associations
- **PDF Study Guides**: Upload and read scripture-based PDF documents
- **Community Forum**: Discuss topics related to songs and scripture
- **Progress Tracking**: Visualize Bible coverage across different books and verses
- **Playlists**: Create manual and auto-generated playlists based on various criteria
- **Journeys**: Premium portfolio pages where users create time-based "Seasons" to showcase their scripture songs in an elegant, scrolling timeline format with glassmorphism effects and premium animations
- **User Authentication**: Google OAuth integration for user management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15.3.4 with Pages Router
- Uses the `/pages` directory structure for file-based routing
- Server-side rendering and API routes in the same application
- TypeScript for type safety across the codebase

**UI Component System**: ShadCN UI (Radix UI primitives + Tailwind CSS)
- Reusable component library in `/components` directory
- Consistent design system with glassmorphism effects and gradient themes
- Dark mode support throughout the application
- Responsive design optimized for mobile and desktop

**State Management**:
- React Context API for global state (MusicPlayerContext, ThemeContext)
- TanStack Query (React Query) for server state and caching
- React Hook Form with Zod for form validation and management

**Design Patterns**:
- Modern glassmorphism aesthetic with backdrop blur effects
- Gradient color schemes (indigo-purple-pink for forum, emerald-teal for progress)
- Framer Motion for smooth animations and transitions
- Infinite scroll implementation for large datasets

### Backend Architecture

**API Layer**: Next.js API Routes (`/pages/api`)
- RESTful endpoints for songs, playlists, forum, PDFs, and user management
- Input validation using Zod schemas
- Session-based authentication with NextAuth.js v5

**Database Query Pattern**:
- Knex.js query builder for PostgreSQL interactions
- Centralized database instance in `lib/db.ts`
- Migration-based schema management in `db/migrations`
- Materialized views for optimized progress tracking queries

**Key Design Decisions**:
1. **Polymorphic Relationships**: The `likes` table uses `likeable_type` and `likeable_id` columns to support likes on multiple entity types (songs, playlists, comments)

2. **Denormalized Vote Counts**: Forum topics and comments store `upvotes`, `downvotes`, and `score` columns directly for performance, updated via transactions when votes change

3. **Array Columns for Categorization**: Bible verses use PostgreSQL array columns (`ai_lyrics_song_ids`, `human_lyrics_song_ids`, etc.) and JSONB columns (`genre_song_ids`, `translation_song_ids`) for efficient filtering and aggregation

4. **Materialized View for Analytics**: The `progress_materialized_view` aggregates Bible coverage statistics, refreshed after song submissions for performance

5. **Auto-Playlist System**: PostgreSQL functions and triggers automatically maintain playlists based on criteria stored in the `auto_criteria` JSONB column

6. **Journeys System**: Premium artistic portfolio pages where users create time-based "Seasons" to showcase scripture songs. Features include:
   - **Premium Typography**: Playfair Display serif font for headings, Crimson Text for quotes, Inter for body text
   - **Theme Colors**: 6 customizable color themes (indigo, purple, pink, amber, emerald, cyan) that apply to the entire page
   - **Advanced Scroll Animations**: Parallax effects, staggered reveals, smooth spring-based transforms using Framer Motion
   - **Glassmorphism Design**: Sophisticated blur effects, translucent cards, glowing accents
   - **Timeline Layout**: Season info on left, songs on right, with animated connecting lines and glowing timeline nodes
   - **Database**: `journey_profiles` stores user preferences, `journey_seasons` for time periods, `journey_season_songs` links songs with notes

### Authentication & Authorization

**Provider**: NextAuth.js v5 (migrated from v4)
- Google OAuth as the primary authentication provider
- Custom user model with additional fields (username, is_admin, is_moderator)
- Session management with JWT tokens
- Environment variables: `NEXTAUTH_SECRET`, `JWT_SECRET`

**Security Measures**:
- Input sanitization on all user-submitted content
- Parameterized queries to prevent SQL injection
- File upload validation (type and size restrictions)
- Session validation on protected API endpoints
- CORS properly configured for S3 interactions

### Data Storage Solutions

**Primary Database**: PostgreSQL
- Configured via environment variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`)
- Knex.js for migrations and query building
- Tables for songs, users, playlists, forum topics/comments, PDFs, Bible verses, and ratings
- Full-text search using tsvector columns on songs table
- GIN indexes on array and JSONB columns for efficient filtering

**File Storage**: AWS S3
- Audio files (up to 200MB), images (up to 5MB), and PDFs stored in S3
- Presigned URLs for secure client-side uploads
- S3 client configuration in `lib/s3.ts`
- Environment variables: `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_S3_BUCKET_NAME`
- Optional CDN integration via `CDN_URL` environment variable

**Caching Strategy**:
- Materialized view refreshed on song submission
- TanStack Query caching for API responses on the client

## External Dependencies

### Cloud Services

**AWS S3**: File storage for user uploads
- Audio files (songs)
- Cover art and profile images
- PDF documents
- Presigned URL workflow for secure uploads

**SendGrid**: Email delivery service
- User notifications
- Password reset emails (if implemented)
- Configured via `@sendgrid/mail` package

### Authentication

**Google OAuth**: Primary authentication provider
- Configured through NextAuth.js v5
- Requires Google OAuth client ID and secret in environment variables

### Database

**PostgreSQL**: Primary relational database
- Version compatible with Knex.js
- Requires SSL connection (`ssl: { rejectUnauthorized: false }`)
- Connection pooling handled by Knex

### Third-Party Libraries

**UI & Styling**:
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Framer Motion for animations
- Recharts for data visualization

**Form Management**:
- React Hook Form for form state
- Zod for schema validation
- @hookform/resolvers for integration

**HTTP & Data Fetching**:
- Axios for HTTP requests
- TanStack Query for server state management
- SWR patterns for real-time updates

**Music Player**:
- HTML5 Audio API for playback
- Custom context for queue management
- Shuffle and repeat functionality

**PDF Handling**:
- Doqment PDF.js viewer for in-browser PDF rendering
- iframe-based viewer with fullscreen support
- Cross-origin configuration for S3-hosted PDFs

### Development Tools

- ESLint with Next.js configuration
- TypeScript for type checking
- Knex CLI for database migrations
- Next.js built-in development server
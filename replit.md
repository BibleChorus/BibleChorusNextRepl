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
- React Context API for global state (MusicPlayerContext, ThemeContext, SidebarContext)
- TanStack Query (React Query) for server state and caching
- React Hook Form with Zod for form validation and management
- SidebarContext tracks `isOpen`, `isMobileOpen`, and `isHomePage` states with automatic state restoration on navigation

**Design Patterns**:
- Modern editorial aesthetic with film grain overlay and ambient orbs (home page and journeys)
- Gold accent color theme (#d4af37 dark mode, #bfa130 light mode) for home and journeys pages
- Italiana serif font for headings, Manrope sans-serif for body text
- Gradient color schemes (indigo-purple-pink for forum, emerald-teal for progress)
- Framer Motion for smooth animations and transitions
- Infinite scroll implementation for large datasets

**Home Page Design**:
- Matches journeys page aesthetic with film grain overlay and animated ambient orbs
- Features all seven app sections: Listen, Upload, Journeys, Playlists, Progress, Forum, Bible Study
- Stats section showing total songs, community members, and song plays
- Sidebar is minimized by default with hamburger menu to expand
- Community CTA section encouraging user sign-up or exploration
- Responsive design with elegant typography and gold accents

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

6. **Journeys System**: Premium artistic portfolio pages where users create time-based "Seasons" to showcase scripture songs. Features an editorial magazine-style aesthetic with global dark/light theme support (uses system-wide next-themes, no per-journey theming):
   - **Premium Typography**: Italiana serif font for headings, Manrope sans-serif for body text
   - **Theme-Responsive Color Palettes**:
     - Dark mode: Void (#050505) background, silk (#e5e5e5) text, mist (#a0a0a0) secondary, gold (#d4af37) accents
     - Light mode: Porcelain (#f8f5f0) background, onyx (#161616) text, pewter (#4a4a4a) secondary, antique gold (#bfa130) accents
   - **Theme Integration**: Uses next-themes with useTheme hook, mounted state check for SSR hydration safety
   - **Visual Effects**: Film grain overlay, custom animated cursor (adapts to theme), ambient orbs (gold/mist tints that adjust per theme), scroll progress indicator
   - **Hero Animations**: Smooth fade-in/slide-up animations using framer-motion with staggered timing (0.1s-0.9s delays) and easeOutExpo [0.16, 1, 0.3, 1] easing. Hero content fades out with parallax effect when scrolling down.
   - **Song Art Reveal**: Song artwork appears on hover/touch/play with grayscale-to-color transition effect. Art slides in from the right with gradient fade edge.
   - **Advanced Scroll Animations**: Staggered reveals with cubic-bezier(0.16, 1, 0.3, 1) easing, Framer Motion transforms
   - **Timeline Layout**: Sticky sidebar with giant year watermark (10% opacity), minimal track rows for songs
   - **Track Rows**: Minimal design (number, play button, title, date, duration) instead of card-based layout
   - **Important Dates**: Users can add milestone dates (baptism, marriage, births, etc.) within seasons that display chronologically alongside songs
     - Database: `journey_season_important_dates` table with title, description, event_date, photo_url
     - Important dates appear before songs on the same date
     - Display component: JourneyImportantDate.tsx with photo reveal on hover/click
   - **Database**: `journey_profiles` stores user preferences (including `likes_count` for denormalized like counting), `seasons` for time periods, `journey_season_songs` links songs with notes, `journey_season_important_dates` stores milestone dates
   - **Components**: JourneyEffects.tsx (shared visual primitives), JourneyHero.tsx, JourneyTimeline.tsx, JourneySong.tsx, JourneyImportantDate.tsx
   - **Public Journeys Discovery**: The `/journeys` page displays all public journeys sorted by likes, showing creator info, title, subtitle, song count, and like count
   - **Journey Likes**: Users can like public journeys using the polymorphic `likes` table with `likeable_type='journey'`
   - **API Endpoints**:
     - `/api/journeys/public.ts` - Lists public journeys with song/like counts
     - `/api/journeys/like.ts` - Like/unlike journeys (POST/DELETE with transaction handling)
     - `/api/journeys/check.ts` - Checks if user has created a journey with content

7. **Song Type Distinction (Scripture vs Journey Songs)**:
   - **Scripture Songs**: Bible-based songs that closely follow scripture (word_for_word, close_paraphrase, creative_inspiration adherence). Require Bible verse metadata and translation. Displayed by default on Listen page.
   - **Journey Songs**: Personal Christian journey recordings (prior_recording, journal_entry, dream, testimony, life_milestone, prophetic_word, other origins). Can have somewhat_connected or no_connection scripture adherence. Bible fields optional for journey-only songs.
   - **Music Origin**: Tracks how music was created (human, ai, ai_cover_of_human) replacing boolean music_ai_generated
   - **Journey Date**: Optional date field for when the song moment occurred, with fallback to created_at. Used in Journeys timeline display.
   - **Listen Page Filtering**: Default shows scripture songs only; toggle to include journey songs
   - **Database Fields**: `is_journey_song` (boolean), `journey_date` (timestamp), `journey_song_origin` (enum), `music_origin` (enum)

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
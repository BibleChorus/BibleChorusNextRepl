# BibleChorus - Scripture-Based Music Platform

## Overview

BibleChorus is a Next.js web application designed to be a comprehensive platform for Bible-based music and study. It allows users to upload, discover, and interact with scripture-centric music and educational materials. The platform aims to foster community engagement, facilitate scripture learning through music, and track user progress in Bible coverage. Key capabilities include a music library with verse associations, PDF study guides, community forums, progress tracking, dynamic playlist generation, and premium "Journeys" for showcasing scripture songs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with Next.js 15.3.4 (Pages Router) and TypeScript. It uses ShadCN UI (Radix UI + Tailwind CSS) with a gold-themed design system featuring:

**Design System:**
- **Colors:** Gold accent (#d4af37 dark mode, #bfa130 light mode) with neutral backgrounds
- **Typography:** Italiana serif for headings, Manrope sans-serif for body text
- **Layout:** Sharp corners (no rounded elements), subtle borders instead of glassmorphism
- **Theme Support:** Full dark/light mode with theme-aware inline styles

State management is handled by React Context API for global state, TanStack Query for server state, and React Hook Form with Zod for form validation. Framer Motion is used for animations, and visual elements like a film grain overlay and ambient orbs provide a modern editorial aesthetic. The application features distinct designs for the Home, Listen, Forum, Progress, Playlists, Song Detail, PDF Library, Profile, Upload, and How-To pages, all adhering to the gold accent and editorial aesthetic. Shared components like the layout, music player, authentication buttons, and search inputs maintain visual consistency.

### Backend Architecture

The backend utilizes Next.js API Routes for its RESTful API, with input validation via Zod. NextAuth.js v5 handles session-based authentication using Google OAuth. Data persistence is managed by PostgreSQL with Knex.js for query building and migrations. Key design decisions include polymorphic relationships for likes, denormalized vote counts for performance, array and JSONB columns for efficient data categorization, and a materialized view for optimized progress tracking analytics. An auto-playlist system uses PostgreSQL functions, and the "Journeys" feature offers artistic portfolio pages with custom timelines, important dates, and specific song types (Scripture vs. Journey songs) differentiated by `is_journey_song`, `journey_date`, `journey_song_origin`, and `music_origin` fields.

### Authentication & Authorization

NextAuth.js v5 is used with Google OAuth as the primary provider. The system incorporates a custom user model and JWT for session management. Security measures include input sanitization, parameterized queries, file upload validation, session validation on protected endpoints, and proper CORS configuration for S3.

### Data Storage Solutions

PostgreSQL serves as the primary relational database, configured via environment variables and accessed through Knex.js. It includes tables for core entities, full-text search, and GIN indexes. AWS S3 is used for file storage of audio, images, and PDFs, utilizing presigned URLs for secure client-side uploads. A caching strategy involves materialized views and TanStack Query.

## External Dependencies

### Cloud Services

- **AWS S3**: For storing user-uploaded audio files, images, and PDF documents.
- **SendGrid**: For email delivery (user notifications, password resets).

### Authentication

- **Google OAuth**: Primary authentication provider integrated via NextAuth.js.

### Database

- **PostgreSQL**: The main relational database for all application data, accessed via Knex.js.

### Third-Party Libraries

- **UI & Styling**: Radix UI, Tailwind CSS, Framer Motion, Recharts.
- **Form Management**: React Hook Form, Zod, @hookform/resolvers.
- **HTTP & Data Fetching**: Axios, TanStack Query.
- **Music Player**: HTML5 Audio API.
- **PDF Handling**: Doqment PDF.js viewer.

### Development Tools

- ESLint, TypeScript, Knex CLI.
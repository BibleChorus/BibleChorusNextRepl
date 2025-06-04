
# Codex Contribution Guidelines

This document provides guidelines for AI agents (e.g., OpenAI Codex) when making changes to the **BibleChorusNextRepl** codebase. Following these practices will ensure that updates and bug fixes are safe, contextually aware, and in line with the project's architecture and standards.

## 1. Safe and Contextually Aware Code Updates

- **Understand the Code Context:** Before making changes, review relevant parts of the codebase to understand how a component or function is used. For example, if updating the file‑upload logic, check both the API route (e.g., `pages/api/upload-url.ts`) and any client‑side usage in the upload form. Male sure to revire the reference.md files and keep them up to date with any changes. They are located in the Reference directory. 
- **Preserve Functionality:** Ensure that bug fixes or new code do not regress existing features like learning modules, user uploads, or rating systems. After changes, test affected workflows (e.g., uploading a song, rating a song, forum interactions) to verify everything still works as expected.  
- **Follow Existing Patterns:** Use established coding patterns in the project for consistency. API routes should validate input and respond with proper HTTP status codes (see how `upload-url.ts` handles method checks and errors). Similarly, follow the project's error‑handling and logging style – catching errors and logging them on the server – to maintain consistency and debuggability.  
- **Maintain Security:** Keep security in mind with every change. Continue to sanitize and validate user inputs using Zod schemas and manual checks in forms and API routes. Use parameterized queries or the Knex query‑builder for database operations to avoid SQL injection. Never expose sensitive data (like passwords or keys) in client‑side code or logs – rely on environment variables and backend logic.  
- **Testing Changes:** After implementing a change, perform manual or automated testing. If the project grows tests in the future, ensure new code is covered. In the absence of formal tests, manually try common user actions relevant to the change (for example, if you modify the song‑submission flow, attempt to submit a song in a development environment).  

## 2. Documentation and Context Updates

- **Update Documentation with Code Changes:** Whenever your changes affect the app’s behavior, architecture, or environment, update the documentation. This includes **AGENTS.md** (this guide) and other markdown files like **README.md** or any reference docs. For example, if you introduce a new environment variable or change a database schema, document it.  
- **Maintain DEVLOG or Changelog:** If a **DEVLOG.md** or similar file is used to track changes, add entries for noteworthy updates or fixes you make. Even if one doesn’t exist yet, consider creating a section in documentation to log architecture changes or significant feature additions.  
- **Self‑Referential Updates:** When modifying or extending these guidelines (AGENTS.md), do so in a way that future AI agents can easily grasp. For instance, if you add a new framework or major library to the project, include best practices for it here. Codex (and other agents) should reference this guide before coding, so it should always reflect the current state of the codebase.

## 3. Next.js and ShadCN UI Best Practices

- **Adhere to Next.js Conventions:** Follow Next.js conventions for project structure and data fetching. This project uses the **pages/** directory for routing and API routes, so keep new pages or API endpoints consistent with the existing pattern. Place new API endpoints under **pages/api** and ensure their filename and URL structure align with Next.js routing rules.  
- **Use ShadCN UI Components:** The app uses ShadCN UI (Radix UI + Tailwind) for a consistent design system. When creating or updating UI elements, prefer using the existing components in **components/ui/** or extend them rather than introducing new UI libraries.  
- **Consistency in Styling:** Maintain the Tailwind CSS styling conventions already in use. The project’s Tailwind config defines a color palette and base styles. Use utility classes consistently and avoid inline styles. Respect dark/light modes by utilizing the existing ThemeProvider context and CSS variables if applicable.  
- **Avoid Breaking UX:** Ensure that UI/UX remains smooth. For instance, if working on navigation or loading states, note that the app uses a custom loading spinner and route‑change handling in `_app.tsx` to indicate loading. Preserve or enhance such patterns rather than removing them. All interactive elements should remain accessible (e.g., keep proper ARIA labels and keyboard navigation).

## 4. PostgreSQL Database Best Practices

- **Use Migrations for Schema Changes:** Do not directly alter the database schema without a migration. If you need to create or modify tables, use Knex migrations (add a new file under **db/migrations/** with an incremental timestamp) rather than editing the database schema ad hoc.  
- **Maintain Data Consistency:** Follow patterns in database operations for consistency. Use the centralized Knex instance (`lib/db.ts`) for queries. Write queries using Knex’s query builder or parameter binding – avoid raw SQL unless necessary, and even then use `knex.raw` with bindings to prevent SQL injection.  
- **Performance and Indexing:** If you add new queries or find slow queries, consider indexing appropriate columns or optimizing the query structure. The app already uses a materialized view to optimize certain coverage queries; emulate such patterns if new features would benefit from them.  
- **Use Environment Config for DB:** Continue using environment variables for database credentials as the project currently does. Do not hard‑code connection info. If you introduce any new config (for example, read‑replica connection or a new Redis cache), also handle those via env vars and document them in README/AGENTS.md.

## 5. AWS S3 and File Upload Best Practices

- **Leverage Existing S3 Utilities:** The project is configured to use AWS S3 for storing uploaded files. Use the provided S3 client in `lib/s3.ts` for any S3 operations.  
- **Presigned URLs for Uploads:** Continue the pattern of using presigned URLs for user file uploads. The existing implementation generates presigned upload URLs on the server (`/api/upload-url.ts`) and uses them on the client for direct S3 upload.  
- **File Validation and Limits:** Enforce file‑type and size restrictions as done currently. Song audio files are limited to 200 MB and images to 5 MB, checked both on client and server. Any new upload functionality should have similar validations to prevent abuse.  
- **Cleanup and Lifecycle:** Ensure that files stored on S3 that are not needed get cleaned up. The project includes an API endpoint to delete unsubmitted files. If your changes involve file management (e.g., replacing a file), extend the cleanup process as needed.  
- **Security of Credentials:** Never log or expose AWS credentials. They should remain in environment config only. Also, if adjusting S3 bucket policies or access, ensure that files meant to be private remain protected.

## 6. General Best Practices

- **Code Style and Linting:** Keep the code style consistent. Run `npm run lint` before committing changes to catch formatting or code‑quality issues. Similarly, run TypeScript’s compiler to catch type errors (`npm run build` will do a type check).  
- **Stay Informed:** If the project upgrades major dependencies (Next.js, React, ShadCN UI, etc.), update these guidelines to reflect new best practices.  
- **Collaboration Etiquette:** When committing changes, write clear commit messages. If using Pull Requests, follow any existing template or conventions for PR descriptions. Maintain a human‑readable commit history, and ensure you work with the latest code and resolve merge conflicts properly.

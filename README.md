Welcome to the NextJS base template bootstrapped using the `create-next-app`. This template supports TypeScript, but you can use normal JavaScript as well.

## Getting Started

Install dependencies and apply the database schema:

```bash
npm install
npm run migrate
```

Create a `.env` file with the environment variables listed below. Once configured, start the development server:

```bash
npm run dev
```

The site runs on `http://localhost:3000` by default. Major features can be found at:

- **Songs** – `/listen` lists uploaded songs, `/Songs/[id]` shows a song page.
- **PDFs** – `/pdfs` lists study guides and `/pdfs/upload` allows uploads.
- **Forum** – `/forum` hosts community discussions.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on `/api/hello`. This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Productionizing your Next App

To make your next App run smoothly in production make sure to deploy your project with [Repl Deployments](https://docs.replit.com/hosting/deployments/about-deployments)!

You can also produce a production build by running `npm run build` and [changing the run command](https://docs.replit.com/programming-ide/configuring-repl#run) to `npm run start`.

## Environment Variables

The application uses PostgreSQL and AWS S3. Create a `.env` file with at least the following variables:

- `JWT_SECRET` – required for JWT authentication.
- `NEXTAUTH_SECRET` – secret used by NextAuth.
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` – database connection values used by `knexfile.js`. Alternatively set `DATABASE_URL`.
- `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_S3_BUCKET_NAME` – S3 configuration in `lib/s3.ts` and API routes.
- `CDN_URL` and `NEXT_PUBLIC_CDN_URL` – base URL for uploaded files on the server and client.
- `NEXT_PUBLIC_BASE_URL` – full site URL used when generating links in emails.
- `SENDGRID_API_KEY` – required to send email reports.

## Database Schema

Database tables and indexes are created using Knex migrations found in `db/migrations`. Documentation for each table lives under the `Reference/` directory.

## PDF Upload and Reader

Users can upload PDF documents containing scripture or Bible study material. Uploaded files are processed to extract text, detect verse references, and link them to the existing verse database. Each PDF has its own page where readers can view the document through an integrated PDF.js viewer, leave comments, track personal notes, and rate the document.

The new viewer is powered by **Doqment** which adds smart zoom and allows hiding the toolbar. It also respects the app's light and dark themes so PDFs match the surrounding UI.
Frames include `allow="fullscreen"` so the viewer can enter fullscreen mode. A built-in toggle uses the browser Fullscreen API and displays a toast when entering or exiting fullscreen.

Developers should ensure OCR tools are available if PDFs lack embedded text. The default implementation tries `pdf-parse` first and can fall back to Tesseract or AWS Textract. Configure the following environment variables for uploads:

- `AWS_S3_BUCKET_NAME` – S3 bucket where files are stored.
- `AWS_REGION` – region for S3 operations.
- `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` – credentials for S3.
- `CDN_URL` – optional base URL used when serving uploaded files.

- PDF uploads are limited to 10MB. The client requests a presigned URL from `/api/upload-url` with `uploadType: "pdf"` before uploading directly to S3.

Run `npm run migrate` to apply the database migrations that create the `pdfs` and related tables.

Welcome to the NextJS base template bootstrapped using the `create-next-app`. This template supports TypeScript, but you can use normal JavaScript as well.

## Getting Started

Hit the run button to start the development server.

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

## PDF Upload and Reader

Users can upload PDF documents containing scripture or Bible study material. Uploaded files are processed to extract text, detect verse references, and link them to the existing verse database. Each PDF has its own page where readers can navigate pages, leave comments, track personal notes, and rate the document.

Developers should ensure OCR tools are available if PDFs lack embedded text. The default implementation tries `pdf-parse` first and can fall back to Tesseract or AWS Textract. Configure the following environment variables for uploads:

- `AWS_S3_BUCKET_NAME` – S3 bucket where files are stored.
- `AWS_REGION` – region for S3 operations.
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` – credentials for S3.
- `CDN_URL` – optional base URL used when serving uploaded files.

Run `npm run migrate` to apply the database migrations that create the `pdfs` and related tables.

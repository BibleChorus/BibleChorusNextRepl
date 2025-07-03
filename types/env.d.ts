declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test';
    NEXT_PUBLIC_CDN_URL: string;
    NEXT_PUBLIC_BASE_URL?: string;
    CDN_URL?: string;
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    AWS_S3_BUCKET_NAME?: string;
    AWS_REGION?: string;
    AWS_ACCESS_KEY?: string;
    AWS_SECRET_KEY?: string;
    SENDGRID_API_KEY?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    NEXTAUTH_SECRET?: string;
    /** Add more environment variables here as your project grows */
    [key: string]: string | undefined;
  }
}
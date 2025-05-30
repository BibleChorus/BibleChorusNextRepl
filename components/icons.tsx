import {
  LucideProps,
  Moon,
  SunMedium,
  Twitter,
  Type,
  GithubIcon,
  Loader2,
  User,
  UserPlus,
  LogIn,
} from "lucide-react"

export const Icons = {
  sun: SunMedium,
  moon: Moon,
  twitter: Twitter,
  logo: Type,
  gitHub: GithubIcon,
  spinner: Loader2,
  google: (props: LucideProps) => (
    <svg {...props} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  ),
  apple: (props: LucideProps) => (
    <svg {...props} viewBox="0 0 24 24">
      <path
        d="M17.05 20.28c-.98.95-2.05.88-3.08.41-1.07-.48-2.05-.53-3.17 0-1.44.7-2.21.5-3.08-.41-4.64-4.75-3.84-11.48 1.41-11.89 1.33.09 2.22.82 3.01.94.95-.15 1.86-.91 3.11-.97 1.25.02 2.4.6 3.23 1.61-2.99 1.79-2.23 5.81.78 6.93-.84 2.26-2.24 4.91-3.21 6.38zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="currentColor"
      />
    </svg>
  ),
  user: User,
  userPlus: UserPlus,
  login: LogIn,
}

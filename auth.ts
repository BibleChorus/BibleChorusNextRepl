import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import db from './db'

// Extend the built-in session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: number;
      username: string;
      is_admin: boolean;
      is_moderator: boolean;
      email: string;
      profile_image_url: string | null;
    } & DefaultSession["user"]
    access_token?: string;
  }

  interface User {
    id: number;
    username: string;
    is_admin: boolean;
    is_moderator: boolean;
    profile_image_url: string | null;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

// Define the structure of the Google profile
interface GoogleProfile {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  sub: string; // Google's unique identifier
}

// Add this type to better handle profile images
interface UserProfile {
  id: number;
  email: string;
  username: string;
  profile_image_url: string | null;
  email_verified: boolean;
  is_admin: boolean;
  is_moderator: boolean;
  last_login: Date;
  created_at: Date;
  auth_type: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          prompt: "consent",
          access_type: 'offline',
          response_type: 'code'
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  
  // Configure session handling
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks to handle the authentication flow
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile
        
        try {
          // Check if user exists
          let dbUser = await db('users')
            .where({ email: googleProfile.email })
            .first() as UserProfile | undefined

          if (!dbUser) {
            // Create new user if doesn't exist
            [dbUser] = await db('users')
              .insert({
                email: googleProfile.email,
                username: googleProfile.name,
                email_verified: googleProfile.email_verified,
                profile_image_url: googleProfile.picture,
                last_login: new Date(),
                created_at: new Date(),
                auth_type: 'google',
                password_hash: null,
                is_admin: false,
                is_moderator: false
              })
              .returning('*')
          } else {
            // Update existing user's profile data
            const updateData: Partial<UserProfile> = {
              email_verified: googleProfile.email_verified,
              last_login: new Date(),
            }

            if (!dbUser.profile_image_url) {
              updateData.profile_image_url = googleProfile.picture
            }

            await db('users')
              .where({ id: dbUser.id })
              .update(updateData)
          }

          return true
        } catch (error) {
          console.error('Error during Google sign in:', error)
          return false
        }
      }
      return true
    },

    async jwt({ token, account, profile }) {
      // Add auth_time to the token when it's created
      if (account) {
        token.auth_time = Math.floor(Date.now() / 1000)
        
        // Store access_token and refresh_token if available
        if (account.access_token) {
          token.access_token = account.access_token
        }
        if (account.refresh_token) {
          token.refresh_token = account.refresh_token
        }
      }

      // Check token expiration
      const auth_time = token.auth_time as number
      if (auth_time && Date.now() / 1000 - auth_time > 30 * 24 * 60 * 60) {
        // Token has expired
        return {}
      }

      return token
    },

    async session({ session, token }) {
      // Add user data from database to session
      if (session.user?.email) {
        const dbUser = await db('users')
          .where({ email: session.user.email })
          .first() as UserProfile | undefined

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.username = dbUser.username
          session.user.is_admin = dbUser.is_admin
          session.user.is_moderator = dbUser.is_moderator
          // Set profile image - prefer custom image if it exists
          session.user.profile_image_url = dbUser.profile_image_url
        }
      }

      // Add access token to session if needed
      if (token.access_token) {
        session.access_token = token.access_token as string
      }

      return session
    },
  },

  // Note: Event handlers can be added later if needed

  // Custom pages if needed
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  // Add additional security configurations
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: 'biblechorus.com'
      }
    }
  }
})
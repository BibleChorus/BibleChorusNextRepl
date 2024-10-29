import NextAuth, { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import db from '../../../db'

// Extend the built-in session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: number;
      username: string;
      is_admin: boolean;
      is_moderator: boolean;
      email: string;
    } & DefaultSession["user"]
    access_token?: string;
  }

  interface User extends DefaultUser {
    id: number;
    username: string;
    is_admin: boolean;
    is_moderator: boolean;
  }
}

// Extend the built-in JWT type
declare module "next-auth/jwt" {
  interface JWT {
    auth_time?: number;
    access_token?: string;
    refresh_token?: string;
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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Specify the scopes we want to access
      authorization: {
        params: {
          scope: 'openid email profile',
          // Enable incremental authorization
          include_granted_scopes: true,
          // Request offline access to get a refresh token
          access_type: 'offline',
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
            .first()

          if (!dbUser) {
            // Create new user if doesn't exist
            [dbUser] = await db('users')
              .insert({
                email: googleProfile.email,
                username: googleProfile.name,
                email_verified: googleProfile.email_verified,
                profile_image_url: googleProfile.picture,
                // Store additional profile data as needed
              })
              .returning('*')
          } else {
            // Update existing user's profile data
            await db('users')
              .where({ id: dbUser.id })
              .update({
                email_verified: googleProfile.email_verified,
                profile_image_url: googleProfile.picture,
                last_login: new Date(),
              })
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
          .first()

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.username = dbUser.username
          session.user.is_admin = dbUser.is_admin
          session.user.is_moderator = dbUser.is_moderator
        }
      }

      // Add access token to session if needed
      if (token.access_token) {
        session.access_token = token.access_token as string
      }

      return session
    },
  },

  // Configure event handlers
  events: {
    async signOut({ token }) {
      // Update last_login in database
      if (token?.email) {
        await db('users')
          .where({ email: token.email })
          .update({ last_login: new Date() })
      }
    },
  },

  // Custom pages if needed
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
}

export default NextAuth(authOptions)

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
      profile_image_url: string | null;
    } & DefaultSession["user"]
    access_token?: string;
  }

  interface User extends DefaultUser {
    id: number;
    username: string;
    is_admin: boolean;
    is_moderator: boolean;
    profile_image_url: string | null;
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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
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
          }

          // Add null check before updating user object
          if (dbUser) {
            // Important: Update the user object with database values
            user.id = dbUser.id;
            user.username = dbUser.username;
            user.is_admin = dbUser.is_admin;
            user.is_moderator = dbUser.is_moderator;
            user.profile_image_url = dbUser.profile_image_url;
          } else {
            console.error('Failed to create or retrieve user from database');
            return false;
          }

          return true
        } catch (error) {
          console.error('Error during Google sign in:', error)
          return false
        }
      }
      return true
    },

    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.username = user.username;
        token.is_admin = user.is_admin;
        token.is_moderator = user.is_moderator;
        token.profile_image_url = user.profile_image_url;
        token.access_token = account.access_token;
      }
      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as number;
        session.user.username = token.username as string;
        session.user.is_admin = token.is_admin as boolean;
        session.user.is_moderator = token.is_moderator as boolean;
        session.user.profile_image_url = token.profile_image_url as string;
        session.access_token = token.access_token as string;
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
}

export default NextAuth(authOptions)

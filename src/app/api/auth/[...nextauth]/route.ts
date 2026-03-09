import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Email Registration Provider (No password needed)
    CredentialsProvider({
      id: "email-register",
      name: "Email Registration",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.name) {
          throw new Error("Name and email are required");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format");
        }

        // Validate name length
        if (credentials.name.trim().length < 2) {
          throw new Error("Name must be at least 2 characters");
        }

        const emailLower = credentials.email.toLowerCase();

        try {
          // Check if user already exists
          let user = await prisma.user.findUnique({
            where: { email: emailLower },
          });

          // If user doesn't exist, create new user
          if (!user) {
            user = await prisma.user.create({
              data: {
                id: crypto.randomUUID(),
                name: credentials.name.trim(),
                email: emailLower,
                image: null,
                emailVerified: null,
                plan_id: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Registration error:", error);
          throw new Error("Failed to register user");
        }
      },
    }),

    // Email Login Provider (No password needed)
    CredentialsProvider({
      id: "email-login",
      name: "Email Login",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email is required");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format");
        }

        const emailLower = credentials.email.toLowerCase();

        try {
          // Check if user exists
          const user = await prisma.user.findUnique({
            where: { email: emailLower },
          });

          // If user doesn't exist, return error
          if (!user) {
            throw new Error("No account found with this email. Please sign up first.");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Login error:", error);
          if (error instanceof Error) {
            throw error; // Preserve the original error message
          }
          throw new Error("Failed to login");
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/",
    error: "/",
  },

  callbacks: {
    // ✅ Create user if not exists (for Google OAuth)
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Only create user for Google provider
      // Credentials provider creates user in authorize()
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: crypto.randomUUID(),
              name: user.name ?? null,
              email: user.email,
              image: user.image ?? null,
              emailVerified: new Date(),
              plan_id: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }

      return true;
    },

    // ✅ Handle redirect
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/dashboard/duprun")) return `${baseUrl}${url}`;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard/duprun`;
    },

    // ✅ Attach planId and userId in JWT
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { plan_id: true, id: true },
        });

        if (dbUser) {
          token.planId = dbUser.plan_id;
          token.userId = dbUser.id;
        }
      }
      return token;
    },

    // ✅ Attach planId and id to session
    async session({ session, token }) {
      if (session.user) {
        session.user.planId = token.planId as number;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
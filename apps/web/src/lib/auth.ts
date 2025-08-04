import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"
import { Adapter } from "next-auth/adapters"

// Debug: Check if prisma client is properly initialized
console.log("Prisma client models:", Object.keys(prisma))

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Nodemailer({
      server: `smtp://${process.env.EMAIL_SERVER_HOST || "mailhog"}:${process.env.EMAIL_SERVER_PORT || 1025}`,
      from: process.env.EMAIL_FROM || "noreply@soccer-unify.local",
    }),
  ],
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  session: {
    strategy: "database", // Email provider requires database strategy
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (user && session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
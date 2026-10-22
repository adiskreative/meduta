import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getLoginLockoutExpiry,
  isLoginLocked,
} from "@/lib/auth-lockout";

const credentialsSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: parsed.data.email, mode: "insensitive" } },
        });
        if (!user || !user.password) return null;

        const now = new Date();
        if (isLoginLocked(user.loginLockedUntil, now)) return null;

        if (user.loginLockedUntil) {
          await prisma.user.updateMany({
            where: {
              id: user.id,
              loginLockedUntil: { lte: now },
            },
            data: { failedLoginAttempts: 0, loginLockedUntil: null },
          });
        }

        const passwordValid = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );
        if (!passwordValid) {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: { increment: 1 } },
            select: { failedLoginAttempts: true },
          });
          const loginLockedUntil = getLoginLockoutExpiry(
            updatedUser.failedLoginAttempts,
          );
          if (loginLockedUntil) {
            await prisma.user.update({
              where: { id: user.id },
              data: { loginLockedUntil },
            });
          }
          return null;
        }

        const loginStateReset = await prisma.user.updateMany({
          where: {
            id: user.id,
            OR: [
              { loginLockedUntil: null },
              { loginLockedUntil: { lte: now } },
            ],
          },
          data: {
            failedLoginAttempts: 0,
            loginLockedUntil: null,
          },
        });
        if (loginStateReset.count !== 1) {
          return null;
        }
        if (user.emailConfirmationPending) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
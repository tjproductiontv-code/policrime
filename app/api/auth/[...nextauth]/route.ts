// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";        // ← alias gebruiken (als ingesteld)
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      name: "Inloggen",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase(); // ← normaliseer
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).uid = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) (session.user as any).id = String((token as any).uid);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

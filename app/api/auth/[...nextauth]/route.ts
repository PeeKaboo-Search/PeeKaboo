import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Extend the Session interface to include the id property
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub; // Add user ID to the session
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
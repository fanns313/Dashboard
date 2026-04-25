import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, persist the access token and roles
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.idToken = account.id_token;
        // Extract realm roles from Keycloak access_token
        if (account.access_token) {
          try {
            const decoded = JSON.parse(Buffer.from(account.access_token.split('.')[1], 'base64').toString());
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            token.roles = (decoded as any)?.realm_access?.roles || [];
          } catch (e) {
            token.roles = [];
          }
        } else {
          token.roles = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose roles and admin status to the client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).roles = token.roles || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).isAdmin = ((token.roles as string[]) || []).includes('admin');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).accessToken = token.accessToken;
      return session;
    },
    async authorized({ auth }) {
      return !!auth?.user;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

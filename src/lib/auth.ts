import NextAuth from "next-auth";
import type { NextAuthConfig, Profile } from "next-auth";

// Build Keycloak OIDC endpoint URLs
// Using explicit endpoints to bypass OIDC discovery issuer validation
// (Keycloak behind reverse proxy reports http:// issuer but is only reachable via https://)
const keycloakBase = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "keycloak",
      name: "Keycloak",
      type: "oauth",
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `http://auth.fanns.my.id/realms/${process.env.KEYCLOAK_REALM}`,
      authorization: {
        url: `${keycloakBase}/protocol/openid-connect/auth`,
        params: { scope: "openid email profile" },
      },
      token: `${keycloakBase}/protocol/openid-connect/token`,
      userinfo: `${keycloakBase}/protocol/openid-connect/userinfo`,
      profile(profile: Profile) {
        return {
          id: profile.sub as string,
          name: profile.name ?? profile.preferred_username ?? "",
          email: profile.email as string,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, extract roles but don't store raw tokens to prevent cookie bloat
      if (account) {
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

import { AuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    FacebookProvider({
      id: "instagram",
      name: "Instagram",
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "public_profile,email,instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management"
        }
      },
      token: {
        async request(context) {
          const res = await fetch("https://graph.facebook.com/v11.0/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: context.provider.clientId!,
              client_secret: context.provider.clientSecret!,
              redirect_uri: context.provider.callbackUrl!,
              code: context.params.code!,
            })
          });
          const tokens = await res.json();
          if (!res.ok) {
            console.error("🔴 EXACT FACEBOOK ERROR:", JSON.stringify(tokens, null, 2));
            throw new Error("Token exchange failed");
          }
          return { tokens };
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !account.providerAccountId) return false;

      // Sync user to our database
      const existingUser = await prisma.user.findFirst({
        where: { instagram_id: account.providerAccountId }
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            access_token: account.access_token,
            profile_picture: user.image,
            name: user.name,
          }
        });
      } else {
        await prisma.user.create({
          data: {
            instagram_id: account.providerAccountId,
            access_token: account.access_token,
            profile_picture: user.image,
            name: user.name,
          }
        });
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.providerAccountId = token.providerAccountId as string;
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: false,
};

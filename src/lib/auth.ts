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
      console.log("=== NextAuth signIn Callback ===");
      console.log("Provider:", account?.provider);
      console.log("Account ID:", account?.providerAccountId);
      console.log("Token in account:", account?.access_token ? account.access_token.substring(0, 15) + "..." : "NONE");
      
      if (!account || !account.providerAccountId) {
        console.log("Sign-in failed: No account or providerAccountId");
        return false;
      }

      // Sync user to our database
      const existingUser = await prisma.user.findFirst({
        where: { instagram_id: account.providerAccountId }
      });

      if (existingUser) {
        console.log("Updating existing user:", existingUser.id);
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            access_token: account.access_token,
            profile_picture: user.image,
            name: user.name,
          }
        });
        console.log("Update database success. Access token set to:", updated.access_token ? updated.access_token.substring(0, 15) + "..." : "NONE");
      } else {
        console.log("Creating new user in database");
        const created = await prisma.user.create({
          data: {
            instagram_id: account.providerAccountId,
            access_token: account.access_token,
            profile_picture: user.image,
            name: user.name,
          }
        });
        console.log("Create database success. Access token set to:", created.access_token ? created.access_token.substring(0, 15) + "..." : "NONE");
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        console.log("=== NextAuth jwt Callback ===");
        console.log("Setting accessToken in token");
        token.accessToken = account.access_token;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("=== NextAuth session Callback ===");
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

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      planId: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    userId: string;
    planId: number;
  }
}

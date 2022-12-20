import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id: string;
      isGlobalMod: boolean;
      bannedUntil: Date;
    } & DefaultSession["user"];
  }
  interface User {
    isGlobalMod: boolean;
    bannedUntil: Date;
  }
}

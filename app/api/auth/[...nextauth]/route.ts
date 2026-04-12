import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // or wherever your config is

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
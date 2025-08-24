// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/sign-in" },
});

export const config = {
  matcher: [
    // Alles beveiligen behalve API, static files, favicon en de login/registratie
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up).*)",
  ],
};

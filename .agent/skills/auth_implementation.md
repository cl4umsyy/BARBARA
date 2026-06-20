# 🛠️ Skills: Authentication Implementation (BARBARA E-Commerce)

Panduan ini berisi cara konfigurasi NextAuth.js (Auth.js) v5, login credentials menggunakan Prisma dan bcrypt, serta proteksi halaman via Middleware Next.js.

---

## 1. Konfigurasi NextAuth (`src/lib/auth.ts`)
Konfigurasikan instance Auth.js utama untuk mengelola sesi user dan otorisasi role.

### Implementasi:
```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt'
  }
});
```

---

## 2. API Router Handler (`src/app/api/auth/[...nextauth]/route.ts`)
Gunakan API route dinamis untuk melayani request sign-in, callback OAuth, dan sign-out.

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

---

## 3. Middleware untuk Proteksi Halaman (`src/middleware.ts`)
Gunakan Next.js Middleware untuk memproteksi direktori `/account/*` dan `/admin/*` di level edge server.

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isAccountRoute = nextUrl.pathname.startsWith('/account');
  const isAuthRoute = nextUrl.pathname.startsWith('/auth');

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/login', nextUrl));
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', nextUrl)); // Redirect customer non-admin ke home
    }
  }

  if (isAccountRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', nextUrl));
    }
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/auth/:path*'],
};
```

---

## 4. Mendapatkan Session di Server Component
Untuk membaca data user di React Server Components (RSC):
```tsx
import { auth } from '@/lib/auth';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return <div>Harap login terlebih dahulu.</div>;
  }

  return (
    <div>
      <p>Halo, {session.user.name}</p>
      <p>Role Anda: {session.user.role}</p>
    </div>
  );
}
```

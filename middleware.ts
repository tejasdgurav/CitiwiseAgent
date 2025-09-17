import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const openAccess = process.env.OPEN_ACCESS === 'true' || process.env.OPEN_ACCESS === '1'
  if (openAccess) return NextResponse.next()

  const { pathname } = req.nextUrl
  // Extra guards to avoid any chance of loops
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  const protectedPaths = ['/dashboard', '/agent']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  let token: any = null
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  } catch {
    // If token parsing fails for any reason, do not redirect to avoid loops
    return NextResponse.next()
  }
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/agent/:path*'],
}

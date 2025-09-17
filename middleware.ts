import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const openAccess = process.env.OPEN_ACCESS === 'true' || process.env.OPEN_ACCESS === '1'
  if (openAccess) return NextResponse.next()

  const { pathname } = req.nextUrl
  const protectedPaths = ['/dashboard', '/agent']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
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

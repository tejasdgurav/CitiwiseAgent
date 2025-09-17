export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*', '/agent/:path*', '/api/agent/:path*'],
}

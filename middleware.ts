import type { NextMiddleware } from 'next/server'

export const middleware: NextMiddleware = () => {
  // No-op: temporarily disable auth gating to diagnose blank pages in prod
  return
}

export const config = {
  matcher: [],
}

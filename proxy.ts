import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const user = token ? await getUserFromSessionToken(token) : null
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login') && user) {
    const destination = user.role === 'TECHNICIAN' ? '/dashboard/technicians' : '/dashboard/vendors'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (pathname.startsWith('/dashboard/vendors') && !['VENDOR', 'ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/dashboard/technicians', request.url))
    }

    if (pathname.startsWith('/dashboard/technicians') && !['TECHNICIAN', 'ADMIN'].includes(user.role)) {
      return NextResponse.redirect(new URL('/dashboard/vendors', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*'],
}

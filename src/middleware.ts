import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let pathname = request.nextUrl.pathname

  // === NORMALISATION DE CASSE (sécurisée contre les boucles) ===
  if (/^\/tef_irn/i.test(pathname) && !pathname.startsWith('/TEF_IRN')) {
    const normalizedPath = pathname.replace(/^\/tef_irn/i, '/TEF_IRN')
    const url = request.nextUrl.clone()
    url.pathname = normalizedPath
    return NextResponse.redirect(url, { status: 301 })
  }

  // === Middleware Supabase Auth ===
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return response
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Routes protégées
  const protectedRoutes = [
    '/TEF_IRN/dashboard',
    '/TEF_IRN/practice',
    '/TEF_IRN/writing',
    '/TEF_IRN/grammar-check',
    '/TEF_IRN/vocab',
    '/TEF_IRN/oral',
    '/TEF_IRN/coach',
    '/TEF_IRN/correction',
    '/TEF_IRN/settings',
    '/TEF_IRN/profile'
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/TEF_IRN/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}

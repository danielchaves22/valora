// frontend/middleware.ts - VERSÃƒO CORRIGIDA
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que nÃ£o precisam de autenticaÃ§Ã£o
const publicRoutes = ['/login']

// Arquivos estÃ¡ticos e API routes que nÃ£o devem passar pelo middleware
const excludedPaths = [
  '/_next', 
  '/favicon.ico', 
  '/assets',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ignora arquivos estÃ¡ticos e APIs especÃ­ficas
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Verifica se Ã© uma rota pÃºblica
  const isPublicRoute = publicRoutes.some(route => pathname === route)
  
  // CORREÃ‡ÃƒO: Buscar APENAS nosso cookie especÃ­fico
  const token = request.cookies.get('valora_token')?.value
  
  // Rota protegida e sem autenticaÃ§Ã£o
  if (!isPublicRoute && !token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Rota de login com autenticaÃ§Ã£o
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

// Configura quais caminhos acionam o middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
}

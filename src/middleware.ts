import { NextResponse, type NextRequest } from 'next/server';
import {
  parseSessionCookie,
  SESSION_COOKIE_NAME,
} from './modules/auth/services/auth.service';
import { computeDaysRemaining } from './modules/licensing/services/license.service';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');
  const isSubscriptionRoute = pathname.startsWith('/suscripcion');

  const rawSessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(rawSessionCookie);

  // 1. Si no hay sesión activa y la ruta no es pública de Auth, redirigir a /login
  if (!session && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si hay sesión activa, evaluar vigencia de licencia (can_operate)
  if (session) {
    const daysRemaining = computeDaysRemaining(session.validToIso);
    const canOperate = daysRemaining > 0;

    // Si intenta entrar a /login o /register estando autenticado
    if (isAuthRoute) {
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = canOperate ? '/' : '/suscripcion';
      return NextResponse.redirect(targetUrl);
    }

    // Si la licencia está vencida (can_operate === false) y trata de usar el Estudio 3D (/),
    // redirigir obligatoriamente a /suscripcion (Estándar LICENSE_SERVICE_INTEGRATION.md §3 y §5)
    if (!canOperate && !isSubscriptionRoute) {
      const subUrl = request.nextUrl.clone();
      subUrl.pathname = '/suscripcion';
      return NextResponse.redirect(subUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

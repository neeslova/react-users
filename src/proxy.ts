import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DEFAULT_CALLBACK_URL, loginHref, parseCallbackUrl } from '@/schemas/auth';

/*
 * Proxy (бывший middleware) выполняется до рендеринга и даёт удобные редиректы:
 *  - гость на странице создания/изменения → /login?callbackUrl=<куда шёл>;
 *  - уже вошедший на /login → обратно.
 * Это не единственная защита: страницы проверяют сессию сами (requirePageAccess),
 * а сервис — перед каждой мутацией (requirePermission). Proxy легко обойти
 * (другой маршрут, прямой вызов Server Function), поэтому он только для удобства.
 */
export default auth((request) => {
  const { pathname, search, searchParams } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.viewer);

  if (pathname === '/login') {
    if (!isLoggedIn) return NextResponse.next();
    const target = parseCallbackUrl(searchParams.get('callbackUrl') ?? DEFAULT_CALLBACK_URL);
    return NextResponse.redirect(new URL(target, request.nextUrl));
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL(loginHref(pathname + search), request.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/login', '/users/new', '/users/:id/edit'],
};

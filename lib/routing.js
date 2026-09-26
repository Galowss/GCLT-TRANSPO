// Resolves the `?redirect=` query param used by the login page, the middleware
// and the booking flows so a signed-in user returns to the page they came from
// instead of always landing on the dashboard.

const AUTH_ROUTES = ['/login', '/register', '/verify-email'];

// Only same-origin absolute paths are allowed. This rejects protocol-relative
// URLs ("//evil.com") and backslash variants ("/\evil.com"), which browsers
// normalise into a cross-origin navigation.
export function safeRedirectPath(raw, fallback) {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  const [pathname] = value.split('?');
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return fallback;
  }
  return value;
}

// Appends the current destination to a login link so the user is returned to
// it once authenticated. Preserves any query string already on the target.
export function loginHrefFor(pathname, search = '') {
  const target = `${pathname}${search}`;
  return `/login?redirect=${encodeURIComponent(target)}`;
}

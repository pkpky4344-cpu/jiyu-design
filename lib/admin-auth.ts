export function isAdminAuthorized(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const rawSession = cookieHeader.match(/admin_session=([^;]+)/)?.[1];
  const session = rawSession ? decodeURIComponent(rawSession) : undefined;
  return Boolean(session && process.env.ADMIN_PASSWORD && session === process.env.ADMIN_PASSWORD);
}

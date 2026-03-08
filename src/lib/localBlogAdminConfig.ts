export const LOCAL_BLOG_ADMIN_ROUTE = 'local-blog-admin-studio-chiicake-2026';
export const LOCAL_BLOG_ADMIN_HASH_PATH = `/#/${LOCAL_BLOG_ADMIN_ROUTE}`;
export const LOCAL_BLOG_ADMIN_API_PREFIX = '/api/local-blog-admin';
export const LOCAL_BLOG_ADMIN_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function isLocalAdminHostname(hostname: string) {
  return LOCAL_BLOG_ADMIN_HOSTNAMES.has(hostname);
}

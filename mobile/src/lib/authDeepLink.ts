/**
 * Parses Supabase implicit / PKCE redirect fragments (hash or query) from a URL.
 * Example: https://host/#access_token=...&refresh_token=...&type=signup
 */
export function parseSessionTokensFromUrl(url: string): {
  access_token: string | null;
  refresh_token: string | null;
} {
  let search = '';
  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    search = url.slice(hashIdx + 1);
  } else {
    try {
      const u = new URL(url);
      search = u.search.startsWith('?') ? u.search.slice(1) : u.search;
    } catch {
      return { access_token: null, refresh_token: null };
    }
  }
  const params = new URLSearchParams(search);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
  };
}

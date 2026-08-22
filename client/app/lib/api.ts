const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is missing.');
}

export function apiUrl(path: string) {
  return `${apiBaseUrl?.replace(/\/$/, '')}${path}`;
}
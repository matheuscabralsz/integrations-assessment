import type { RequestInterceptor } from './types.js';

export function authHeader(apiKey: string): RequestInterceptor {
  return init => ({
    ...init,
    headers: {
      'X-API-KEY': apiKey,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

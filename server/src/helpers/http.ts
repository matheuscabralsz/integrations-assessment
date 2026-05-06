import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authHeader } from '../interceptors/authHeader.js';
import { errorThrow } from '../interceptors/errorThrow.js';
import type { RequestInterceptor, ResponseInterceptor } from '../interceptors/types.js';

function findUp(filename: string, startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(`${filename} not found in any parent of ${startDir}`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: findUp('.env', __dirname) });

const baseUrl = process.env.BASE_URL;
const apiKey = process.env.X_API_KEY;

if (!baseUrl) throw new Error('BASE_URL is required (see .env)');
if (!apiKey) throw new Error('X_API_KEY is required (see .env)');

const requestInterceptors: RequestInterceptor[] = [authHeader(apiKey)];
const responseInterceptors: ResponseInterceptor[] = [errorThrow];

function buildUrl(reqPath: string, query?: Record<string, string | number | undefined>): URL {
  const url = new URL(`${baseUrl}${reqPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function request<T>(
  reqPath: string,
  init: RequestInit,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = buildUrl(reqPath, query);

  let enriched = init;
  for (const interceptor of requestInterceptors) {
    enriched = await interceptor(enriched);
  }

  let res = await fetch(url, enriched);
  for (const interceptor of responseInterceptors) {
    res = await interceptor(res, { path: reqPath });
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function apiGet<T>(
  reqPath: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  return request<T>(reqPath, { method: 'GET' }, query);
}

export function apiPost<T>(reqPath: string, body: unknown): Promise<T> {
  return request<T>(reqPath, { method: 'POST', body: JSON.stringify(body) });
}

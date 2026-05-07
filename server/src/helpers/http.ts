import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UpstreamError } from '../errors/UpstreamError.js';

function findUp(filename: string, startDir: string): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error(`${filename} not found in any parent of ${startDir}`);
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required (see .env)`);
  return v;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: findUp('.env', __dirname) });

const baseUrl = required('BASE_URL');
const apiKey = required('X_API_KEY');

type Query = Record<string, string | number | undefined>;

function buildUrl(reqPath: string, query?: Query): URL {
  const url = new URL(`${baseUrl}${reqPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function request<T>(reqPath: string, init: RequestInit, query?: Query): Promise<T> {
  const url = buildUrl(reqPath, query);

  const res = await fetch(url, {
    ...init,
    headers: {
      'X-API-KEY': apiKey,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    let envelope: { code?: string; message?: string; details?: unknown } | undefined;
    try {
      envelope = (JSON.parse(errText) as { error?: typeof envelope })?.error;
    } catch {}
    throw new UpstreamError(
      res.status,
      envelope?.code,
      envelope?.message ?? `Upstream ${res.status} on ${reqPath}`,
      envelope?.details,
    );
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function apiGet<T>(reqPath: string, query?: Query): Promise<T> {
  return request<T>(reqPath, { method: 'GET' }, query);
}

export function apiPost<T>(reqPath: string, body: unknown): Promise<T> {
  return request<T>(reqPath, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut<T>(reqPath: string, body: unknown): Promise<T> {
  return request<T>(reqPath, { method: 'PUT', body: JSON.stringify(body) });
}

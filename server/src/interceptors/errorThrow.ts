import { UpstreamError } from '../errors/UpstreamError.js';
import type { ResponseInterceptor } from './types.js';

type UpstreamErrorEnvelope = {
  error?: { code?: string; message?: string; details?: unknown };
};

export const errorThrow: ResponseInterceptor = async (res, { path: reqPath }) => {
  if (res.ok) return res;
  const text = await res.text();
  const body = text ? (JSON.parse(text) as UpstreamErrorEnvelope) : undefined;
  throw new UpstreamError(
    res.status,
    body?.error?.code,
    body?.error?.message ?? `Upstream ${res.status} on ${reqPath}`,
    body?.error?.details,
  );
};

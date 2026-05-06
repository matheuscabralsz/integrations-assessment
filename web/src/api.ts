import type { TalentsResponse, SyncResponse, Talent } from './types';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, opts: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `${res.status} ${res.statusText}`.trim();
    let code: string | undefined;
    let details: unknown;
    try {
      const parsed = JSON.parse(text);
      const envelope = parsed?.error;
      if (envelope && typeof envelope === 'object') {
        if (typeof envelope.message === 'string') message = envelope.message;
        if (typeof envelope.code === 'string') code = envelope.code;
        details = envelope.details;
      }
    } catch {
      // body wasn't JSON — keep the status-line message
    }
    throw new ApiError(message, { status: res.status, code, details });
  }
  return res.json() as Promise<T>;
}

export function fetchTalents(): Promise<TalentsResponse> {
  return fetch('/api/talents').then(json<TalentsResponse>);
}

export function postSync(talents: Talent[]): Promise<SyncResponse> {
  return fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ talents }),
  }).then(json<SyncResponse>);
}

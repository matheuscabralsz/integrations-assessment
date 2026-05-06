import express from 'express';
import cors from 'cors';
import { apiPost } from './helpers/http.js';
import { UpstreamError } from './errors/UpstreamError.js';
import * as avionte from './integrations/avionte.js';
import * as bullhorn from './integrations/bullhorn.js';
import * as lever from './integrations/lever.js';
import type { Talent, Source, IntegrationError } from './types.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

type SourceError = Omit<IntegrationError, 'source'>;
type SourceResult = { name: Source; talents: Talent[]; error?: SourceError };

app.get('/api/talents', async (_req, res) => {
  const sources: { name: Source; fn: () => Promise<Talent[]> }[] = [
    { name: 'avionte', fn: avionte.fetchAll },
    { name: 'bullhorn', fn: bullhorn.fetchAll },
    { name: 'lever', fn: lever.fetchAll },
  ];

  const results = await Promise.all(
    sources.map(async ({ name, fn }): Promise<SourceResult> => {
      try {
        return { name, talents: await fn() };
      } catch (err) {
        if (err instanceof UpstreamError) {
          return {
            name,
            talents: [],
            error: { message: err.message, code: err.code, status: err.status },
          };
        }
        return { name, talents: [], error: { message: (err as Error).message } };
      }
    }),
  );

  const talents = results.flatMap(({ name, talents }) =>
    talents.map(t => ({ ...t, source: name })),
  );
  const errors: IntegrationError[] = results
    .filter(r => r.error)
    .map(r => ({ source: r.name, ...r.error! }));

  res.json({ talents, errors });
});

app.post('/api/sync', async (req, res) => {
  const body = (req.body ?? {}) as {
    talents?: Array<Record<string, unknown>>;
  } & Record<string, unknown>;
  const talents = (body.talents ?? []).map(({ source: _source, ...rest }) => rest);
  const cleaned = { ...body, talents };

  try {
    const data = await apiPost<unknown>('/sync', cleaned);
    res.json(data);
  } catch (err) {
    if (err instanceof UpstreamError) {
      res.status(err.status).json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    } else {
      res.status(500).json({ error: { message: (err as Error).message } });
    }
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});

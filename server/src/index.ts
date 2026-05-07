import express from 'express';
import cors from 'cors';
import { apiPost } from './helpers/http.js';
import { UpstreamError } from './errors/UpstreamError.js';
import { avionte } from './integrations/avionte.js';
import { bullhorn } from './integrations/bullhorn.js';
import { lever } from './integrations/lever.js';
import { fetchAll, type TalentAdapter } from './integrations/adapter.js';
import type { Talent, Status, Source, IntegrationError } from './types.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const adapters: Record<Source, TalentAdapter<any, any>> = {
  avionte,
  bullhorn,
  lever,
};

type SourceError = Omit<IntegrationError, 'source'>;
type SourceResult = { name: Source; talents: Talent[]; error?: SourceError };

app.get('/api/talents', async (_req, res) => {
  const results = await Promise.all(
    Object.values(adapters).map(async (adapter): Promise<SourceResult> => {
      try {
        return { name: adapter.source, talents: await fetchAll(adapter) };
      } catch (err) {
        if (err instanceof UpstreamError) {
          return {
            name: adapter.source,
            talents: [],
            error: { message: err.message, code: err.code, status: err.status },
          };
        }
        return {
          name: adapter.source,
          talents: [],
          error: { message: (err as Error).message },
        };
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

const VALID_STATUS: Status[] = ['Active', 'Inactive', 'DoNotContact'];

function parsePatch(body: unknown): Partial<Talent> {
  const b = (body ?? {}) as Record<string, unknown>;
  const patch: Partial<Talent> = {};
  if (typeof b.firstName === 'string') patch.firstName = b.firstName;
  if (typeof b.lastName === 'string') patch.lastName = b.lastName;
  if (typeof b.emailAddress === 'string') patch.emailAddress = b.emailAddress;
  if (typeof b.mobilePhone === 'string') patch.mobilePhone = b.mobilePhone;
  if (typeof b.city === 'string') patch.city = b.city;
  if (typeof b.state === 'string') patch.state = b.state;
  if (b.status !== undefined) {
    if (!VALID_STATUS.includes(b.status as Status)) {
      throw new Error(`Invalid status: ${String(b.status)}`);
    }
    patch.status = b.status as Status;
  }
  return patch;
}

app.put('/api/talents/:source/:id', async (req, res) => {
  const source = req.params.source as Source;
  const { id } = req.params;
  const adapter = adapters[source];
  if (!adapter) {
    return res.status(400).json({ error: { message: `Unknown source: ${source}` } });
  }
  let patch: Partial<Talent>;
  try {
    patch = parsePatch(req.body);
  } catch (err) {
    return res.status(400).json({ error: { message: (err as Error).message } });
  }
  try {
    const talent = await adapter.update(id, patch);
    res.json({ ...talent, source });
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

import express from 'express';
import cors from 'cors';
import { apiGet } from './helpers/http.js';
import { UpstreamError } from './errors/UpstreamError.js';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/_smoke', async (_req, res) => {
  try {
    const data = await apiGet<unknown>('/avionte/talents', { limit: 1 });
    res.json({ ok: true, sample: data });
  } catch (err) {
    if (err instanceof UpstreamError) {
      res.status(502).json({
        ok: false,
        status: err.status,
        code: err.code,
        message: err.message,
      });
    } else {
      res.status(500).json({ ok: false, message: (err as Error).message });
    }
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});

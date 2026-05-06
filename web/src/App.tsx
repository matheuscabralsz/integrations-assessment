import { useEffect, useState } from 'react';
import { fetchTalents } from './api';
import type { TalentsResponse } from './types';

export default function App() {
  const [data, setData] = useState<TalentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTalents().then(setData).catch(e => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-semibold">Talent Sync</h1>
      {error && <p className="mt-4 text-destructive">{error}</p>}
      {!error && !data && <p className="mt-4 text-muted-foreground">Loading…</p>}
      {data && <pre className="mt-4 text-xs">{JSON.stringify(data.talents.slice(0, 2), null, 2)}</pre>}
    </div>
  );
}

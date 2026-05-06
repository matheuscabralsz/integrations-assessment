import { useEffect, useState } from 'react';
import { fetchTalents } from './api';
import { TalentTable } from './components/TalentTable';
import type { TalentsResponse } from './types';

export default function App() {
  const [data, setData] = useState<TalentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTalents().then(setData).catch(e => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Talent Sync</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unified view across Avionte, Bullhorn, and Lever.
        </p>

        {error && <p className="mt-6 text-destructive">Error: {error}</p>}
        {!error && !data && <p className="mt-6 text-muted-foreground">Loading…</p>}
        {data && <TalentTable rows={data.talents} />}
      </div>
    </div>
  );
}

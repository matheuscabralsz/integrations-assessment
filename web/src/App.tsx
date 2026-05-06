import { useEffect, useState } from 'react';
import { fetchTalents, postSync } from './api';
import { TalentTable } from './components/TalentTable';
import { SyncResults } from './components/SyncResults';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { SyncResponse, TalentsResponse, TalentRow, Talent } from './types';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; data: TalentsResponse };

function stripSource(rows: TalentRow[]): Talent[] {
  return rows.map(({ source: _src, ...rest }) => rest);
}

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);

  useEffect(() => {
    fetchTalents()
      .then(data => setState({ kind: 'loaded', data }))
      .catch(err => setState({ kind: 'error', message: err.message }));
  }, []);

  async function handleSync() {
    if (state.kind !== 'loaded') return;
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const result = await postSync(stripSource(state.data.talents));
      setSyncResult(result);
    } catch (err) {
      setSyncError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Talent Sync</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Unified view across Avionte, Bullhorn, and Lever.
            </p>
          </div>
          {state.kind === 'loaded' && state.data.talents.length > 0 && (
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing…' : `Sync ${state.data.talents.length} records`}
            </Button>
          )}
        </header>

        {state.kind === 'loading' && (
          <p role="status" aria-live="polite" className="text-muted-foreground">
            Loading…
          </p>
        )}

        {state.kind === 'error' && (
          <Alert variant="destructive">
            <AlertTitle>Could not load talents</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.kind === 'loaded' && (
          <>
            {state.data.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Some integrations failed</AlertTitle>
                <AlertDescription>
                  {state.data.errors.map(e => `${e.source}: ${e.message}`).join(' · ')}
                </AlertDescription>
              </Alert>
            )}

            {syncError && (
              <Alert variant="destructive">
                <AlertTitle>Sync failed</AlertTitle>
                <AlertDescription>{syncError}</AlertDescription>
              </Alert>
            )}

            {syncResult && <SyncResults result={syncResult} />}

            {state.data.talents.length === 0 ? (
              <p role="status" aria-live="polite" className="text-muted-foreground">
                No talents loaded — all integrations failed. See the banner above.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {state.data.talents.length} record
                  {state.data.talents.length === 1 ? '' : 's'}
                </p>
                <TalentTable rows={state.data.talents} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

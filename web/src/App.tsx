import { useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetchTalents, postSync } from './api';
import { TalentTable } from './components/TalentTable';
import { SyncResults } from './components/SyncResults';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TalentRow, Talent } from './types';

function stripSource(rows: TalentRow[]): Talent[] {
  return rows.map(({ source: _src, ...rest }) => rest);
}

export default function App() {
  const { data, error, isLoading } = useSWR('talents', fetchTalents);
  const [resultsOpen, setResultsOpen] = useState(false);
  const sync = useSWRMutation(
    'sync',
    (_key, { arg }: { arg: Talent[] }) => postSync(arg),
    { onSuccess: () => setResultsOpen(true) },
  );

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
          {data && data.talents.length > 0 && (
            <Button
              onClick={() => sync.trigger(stripSource(data.talents))}
              disabled={sync.isMutating}
            >
              {sync.isMutating ? 'Syncing…' : `Sync ${data.talents.length} records`}
            </Button>
          )}
        </header>

        {isLoading && (
          <p role="status" aria-live="polite" className="text-muted-foreground">
            Loading…
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Could not load talents</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            {data.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Some integrations failed</AlertTitle>
                <AlertDescription>
                  {data.errors.map(e => `${e.source}: ${e.message}`).join(' · ')}
                </AlertDescription>
              </Alert>
            )}

            {sync.error && (
              <Alert variant="destructive">
                <AlertTitle>Sync failed</AlertTitle>
                <AlertDescription>{(sync.error as Error).message}</AlertDescription>
              </Alert>
            )}

            {data.talents.length === 0 ? (
              <p role="status" aria-live="polite" className="text-muted-foreground">
                No talents loaded — all integrations failed. See the banner above.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {data.talents.length} record
                  {data.talents.length === 1 ? '' : 's'}
                </p>
                <TalentTable rows={data.talents} />
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync results</DialogTitle>
          </DialogHeader>
          {sync.data && <SyncResults result={sync.data} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

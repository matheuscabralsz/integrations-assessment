import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetchTalents, postSync, updateTalent } from './api';
import { TalentTable } from './components/TalentTable';
import { SyncResults, type SyncRowMeta } from './components/SyncResults';
import { EditTalentDialog } from './components/EditTalentDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TalentRow, Talent, TalentsResponse } from './types';

function stripSource(rows: TalentRow[]): Talent[] {
  return rows.map(({ source: _src, ...rest }) => rest);
}

export default function App() {
  const { data, error, isLoading } = useSWR('talents', fetchTalents);
  const { mutate } = useSWRConfig();
  const [resultsOpen, setResultsOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TalentRow | null>(null);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [resolvingAll, setResolvingAll] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const sync = useSWRMutation(
    'sync',
    (_key, { arg }: { arg: Talent[] }) => postSync(arg),
    {
      onSuccess: result => {
        setResultsOpen(true);
        const syncedIds = new Set(
          result.details
            .filter(
              d =>
                d.status === 'created' ||
                d.status === 'updated' ||
                d.status === 'unchanged',
            )
            .map(d => d.id),
        );
        setDirtyKeys(prev => {
          const next = new Set<string>();
          for (const key of prev) {
            const id = key.slice(key.indexOf(':') + 1);
            if (!syncedIds.has(id)) next.add(key);
          }
          return next;
        });
      },
    },
  );

  const nameLookup = useMemo(() => {
    const m = new Map<string, SyncRowMeta>();
    data?.talents.forEach(t => {
      m.set(t.id, {
        name: `${t.firstName} ${t.lastName}`.trim(),
        source: t.source,
      });
    });
    return m;
  }, [data]);

  function handleResolveError(id: string) {
    if (!data) return;
    const row = data.talents.find(t => t.id === id);
    if (!row) return;
    setResultsOpen(false);
    setEditingRow(row);
  }

  async function handleResolveAllConflicts() {
    if (!data || !sync.data) return;
    const conflictIds = new Set(
      sync.data.details.filter(d => d.status === 'conflict').map(d => d.id),
    );
    const rows = data.talents.filter(t => conflictIds.has(t.id));
    if (rows.length === 0) return;

    setResolvingAll(true);
    setResolveError(null);
    setDirtyKeys(prev => {
      const next = new Set(prev);
      for (const r of rows) next.add(`${r.source}:${r.id}`);
      return next;
    });
    try {
      const updated = await Promise.all(
        rows.map(({ source, ...talent }) => updateTalent(source, talent.id, talent)),
      );
      const updatedByKey = new Map(updated.map(u => [`${u.source}:${u.id}`, u]));
      const newTalents = data.talents.map(
        t => updatedByKey.get(`${t.source}:${t.id}`) ?? t,
      );
      mutate(
        'talents',
        current => (current ? { ...current, talents: newTalents } : current),
        { revalidate: false },
      );
      await sync.trigger(newTalents.map(({ source: _s, ...rest }) => rest));
    } catch (err) {
      setResolveError((err as Error).message);
    } finally {
      setResolvingAll(false);
    }
  }

  function handleSaved(updated: TalentRow) {
    mutate(
      'talents',
      (current?: TalentsResponse) => {
        if (!current) return current;
        return {
          ...current,
          talents: current.talents.map(t =>
            t.id === updated.id && t.source === updated.source ? updated : t,
          ),
        };
      },
      { revalidate: false },
    );
    const key = `${updated.source}:${updated.id}`;
    setDirtyKeys(prev => new Set(prev).add(key));
    setHighlightedKey(key);
    setTimeout(() => {
      setHighlightedKey(prev => (prev === key ? null : prev));
    }, 2000);
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
                <TalentTable
                  rows={data.talents}
                  onEdit={setEditingRow}
                  highlightedKey={highlightedKey}
                  dirtyKeys={dirtyKeys}
                />
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
          {resolveError && (
            <Alert variant="destructive">
              <AlertTitle>Resolve failed</AlertTitle>
              <AlertDescription>{resolveError}</AlertDescription>
            </Alert>
          )}
          {sync.data && (
            <SyncResults
              result={sync.data}
              onResolveError={handleResolveError}
              onResolveAllConflicts={handleResolveAllConflicts}
              resolvingAll={resolvingAll}
              nameLookup={nameLookup}
            />
          )}
        </DialogContent>
      </Dialog>

      {editingRow && (
        <EditTalentDialog
          key={`${editingRow.source}:${editingRow.id}`}
          row={editingRow}
          open
          onOpenChange={open => {
            if (!open) setEditingRow(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

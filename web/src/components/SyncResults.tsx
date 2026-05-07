import { Button } from '@/components/ui/button';
import type { SyncResponse, SyncDetail, SyncSummary, Source } from '@/types';

export type SyncRowMeta = { name: string; source: Source };

const STATUS_STYLE = {
  total: 'bg-slate-100 text-slate-900',
  created: 'bg-emerald-100 text-emerald-900',
  updated: 'bg-sky-100 text-sky-900',
  unchanged: 'bg-slate-100 text-slate-700',
  conflict: 'bg-amber-100 text-amber-900',
  error: 'bg-rose-100 text-rose-900',
} as const;

const SUMMARY_TILES: {
  key: keyof SyncSummary;
  label: string;
  styleKey: keyof typeof STATUS_STYLE;
}[] = [
  { key: 'total', label: 'Total', styleKey: 'total' },
  { key: 'created', label: 'Created', styleKey: 'created' },
  { key: 'updated', label: 'Updated', styleKey: 'updated' },
  { key: 'unchanged', label: 'Unchanged', styleKey: 'unchanged' },
  { key: 'conflicts', label: 'Conflicts', styleKey: 'conflict' },
  { key: 'errors', label: 'Errors', styleKey: 'error' },
];

const DETAIL_GROUPS: {
  status: Exclude<SyncDetail['status'], 'unchanged'>;
  label: string;
}[] = [
  { status: 'error', label: 'Errors' },
  { status: 'conflict', label: 'Conflicts' },
  { status: 'created', label: 'Created' },
  { status: 'updated', label: 'Updated' },
];

function groupByStatus(
  details: SyncDetail[],
): Map<SyncDetail['status'], SyncDetail[]> {
  const m = new Map<SyncDetail['status'], SyncDetail[]>();
  for (const d of details) {
    const arr = m.get(d.status) ?? [];
    arr.push(d);
    m.set(d.status, arr);
  }
  return m;
}

function uniqueMessages(items: SyncDetail[]): string[] {
  const set = new Set<string>();
  for (const i of items) {
    if ('message' in i) set.add(i.message);
  }
  return [...set];
}

export function SyncResults({
  result,
  onResolveError,
  onResolveAllConflicts,
  resolvingAll,
  nameLookup,
}: {
  result: SyncResponse;
  onResolveError?: (id: string) => void;
  onResolveAllConflicts?: () => void;
  resolvingAll?: boolean;
  nameLookup?: Map<string, SyncRowMeta>;
}) {
  const groups = groupByStatus(result.details);
  const unchangedCount = groups.get('unchanged')?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUMMARY_TILES.map(t => (
          <span
            key={t.key}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${STATUS_STYLE[t.styleKey]}`}
          >
            <span className="font-semibold">{result.summary[t.key]}</span>
            <span className="opacity-80">{t.label}</span>
          </span>
        ))}
      </div>

      {DETAIL_GROUPS.map(g => {
        const items = groups.get(g.status);
        if (!items || items.length === 0) return null;
        const messages = uniqueMessages(items);
        const sharedMessage = messages.length === 1 ? messages[0] : null;
        return (
          <div key={g.status} className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 border-b px-4 py-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[g.status]}`}
              >
                {g.label} · {items.length}
              </span>
              {sharedMessage && (
                <p className="text-xs text-muted-foreground">{sharedMessage}</p>
              )}
              {g.status === 'conflict' && onResolveAllConflicts && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={onResolveAllConflicts}
                  disabled={resolvingAll}
                >
                  {resolvingAll ? `Resolving ${items.length}…` : `Resolve all ${items.length}`}
                </Button>
              )}
            </div>
            <ul className="divide-y">
              {items.map(d => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 px-4 py-2 text-sm"
                >
                  {(() => {
                    const meta = nameLookup?.get(d.id);
                    if (meta) {
                      return (
                        <span className="flex items-baseline gap-2">
                          <span className="font-medium">{meta.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {meta.source}:{d.id}
                          </span>
                        </span>
                      );
                    }
                    return (
                      <span className="font-mono text-xs text-muted-foreground">
                        {d.id}
                      </span>
                    );
                  })()}
                  <div className="ml-auto flex items-center gap-3">
                    {d.status === 'conflict' && (
                      <span className="text-right text-xs text-muted-foreground">
                        server lastUpdatedDate: {d.serverVersion.lastUpdatedDate}
                        {!sharedMessage && (
                          <>
                            {' · '}
                            <span>{d.message}</span>
                          </>
                        )}
                      </span>
                    )}
                    {d.status === 'error' && !sharedMessage && (
                      <span className="text-right text-xs text-rose-700">
                        {d.message}
                      </span>
                    )}
                    {onResolveError && d.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResolveError(d.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {unchangedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {unchangedCount} unchanged
        </p>
      )}
    </div>
  );
}

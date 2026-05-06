import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SyncResponse, SyncDetail } from '@/types';

const SUMMARY_TILES = [
  { key: 'created', label: 'Created' },
  { key: 'updated', label: 'Updated' },
  { key: 'unchanged', label: 'Unchanged' },
  { key: 'conflicts', label: 'Conflicts' },
  { key: 'errors', label: 'Errors' },
] as const;

const STATUS_STYLE: Record<SyncDetail['status'], string> = {
  created: 'bg-emerald-100 text-emerald-900',
  updated: 'bg-sky-100 text-sky-900',
  unchanged: 'bg-slate-100 text-slate-700',
  conflict: 'bg-amber-100 text-amber-900',
  error: 'bg-rose-100 text-rose-900',
};

const GROUP_ORDER: SyncDetail['status'][] = [
  'error',
  'conflict',
  'created',
  'updated',
  'unchanged',
];

function groupByStatus(details: SyncDetail[]): Map<SyncDetail['status'], SyncDetail[]> {
  const m = new Map<SyncDetail['status'], SyncDetail[]>();
  for (const d of details) {
    const arr = m.get(d.status) ?? [];
    arr.push(d);
    m.set(d.status, arr);
  }
  return m;
}

export function SyncResults({ result }: { result: SyncResponse }) {
  const groups = groupByStatus(result.details);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{result.summary.total}</p>
          </CardContent>
        </Card>
        {SUMMARY_TILES.map(t => (
          <Card key={t.key}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-normal text-muted-foreground">{t.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{result.summary[t.key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {GROUP_ORDER.map(status => {
        const items = groups.get(status);
        if (!items || items.length === 0) return null;
        return (
          <div key={status} className="rounded-lg border bg-card">
            <div className="border-b px-4 py-2">
              <Badge variant="secondary" className={STATUS_STYLE[status]}>
                {status} · {items.length}
              </Badge>
            </div>
            <ul className="divide-y">
              {items.map(d => (
                <li key={d.id} className="flex items-start gap-4 px-4 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{d.id}</span>
                  {d.status === 'conflict' && (
                    <span className="ml-auto text-right text-muted-foreground">
                      {d.message}
                      <br />
                      <span className="text-xs">
                        server lastUpdatedDate: {d.serverVersion.lastUpdatedDate}
                      </span>
                    </span>
                  )}
                  {d.status === 'error' && (
                    <span className="ml-auto text-right text-rose-700">{d.message}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

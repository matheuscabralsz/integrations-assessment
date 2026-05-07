import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TalentRow, Status, Source } from '@/types';

const STATUS_STYLE: Record<Status, string> = {
  Active: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
  Inactive: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  DoNotContact: 'bg-rose-100 text-rose-900 hover:bg-rose-100',
};

const SOURCE_STYLE: Record<Source, string> = {
  avionte: 'bg-blue-100 text-blue-900 hover:bg-blue-100',
  bullhorn: 'bg-amber-100 text-amber-900 hover:bg-amber-100',
  lever: 'bg-violet-100 text-violet-900 hover:bg-violet-100',
};

function rowKey(r: TalentRow) {
  return `${r.source}:${r.id}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TalentTable({
  rows,
  onEdit,
  highlightedKey,
}: {
  rows: TalentRow[];
  onEdit: (row: TalentRow) => void;
  highlightedKey?: string | null;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Skills</TableHead>
            <TableHead>City / State</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...rows]
            .sort((a, b) =>
              a.lastUpdatedDate < b.lastUpdatedDate
                ? 1
                : a.lastUpdatedDate > b.lastUpdatedDate
                ? -1
                : 0,
            )
            .map(r => {
              const key = rowKey(r);
              const highlighted = key === highlightedKey;
              return (
                <TableRow
                  key={key}
                  className={cn(
                    'transition-colors duration-1000',
                    highlighted && 'bg-yellow-100',
                  )}
                >
                  <TableCell>
                    <Badge variant="secondary" className={SOURCE_STYLE[r.source]}>
                      {r.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {r.firstName} {r.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.emailAddress}</TableCell>
                  <TableCell className="text-muted-foreground">{r.mobilePhone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_STYLE[r.status]}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={r.skills.join(', ')}>
                    {r.skills.join(', ')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.city}, {r.state}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(r.lastUpdatedDate)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(r)}
                      aria-label={`Edit ${r.firstName} ${r.lastName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}

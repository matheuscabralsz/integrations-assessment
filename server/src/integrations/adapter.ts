import type { Talent, Source } from '../types.js';

export interface TalentAdapter<TRaw, TCursor> {
  source: Source;
  fetchPage(cursor: TCursor | undefined): Promise<{
    items: TRaw[];
    nextCursor: TCursor | undefined;
  }>;
  normalize(raw: TRaw): Talent;
}

export const PAGE_SIZE = 5;

export async function* paginate<TRaw, TCursor>(
  adapter: TalentAdapter<TRaw, TCursor>,
): AsyncGenerator<TRaw> {
  let cursor: TCursor | undefined;
  while (true) {
    const { items, nextCursor } = await adapter.fetchPage(cursor);
    for (const item of items) yield item;
    if (nextCursor === undefined) return;
    cursor = nextCursor;
  }
}

export async function fetchAll<TRaw, TCursor>(
  adapter: TalentAdapter<TRaw, TCursor>,
): Promise<Talent[]> {
  const out: Talent[] = [];
  for await (const raw of paginate(adapter)) {
    out.push(adapter.normalize(raw))
  }
  return out;
}

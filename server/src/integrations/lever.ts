import { apiGet } from '../helpers/http.js';
import type { Talent, Status } from '../types.js';
import { PAGE_SIZE, type TalentAdapter } from './adapter.js';

type LeverRaw = {
  id: string;
  name: { first: string; last: string };
  emails: { value: string; type: string }[];
  phones: { value: string; type: string }[];
  tags: string[];
  isActive: boolean;
  doNotContact: boolean;
  location?: { locality: string; region: string; country: string };
  updatedAt: string;
  createdAt: string;
};

type LeverList = {
  items: LeverRaw[];
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
};

function leverStatus(raw: LeverRaw): Status {
  if (raw.doNotContact) return 'DoNotContact';
  return raw.isActive ? 'Active' : 'Inactive';
}

export const lever: TalentAdapter<LeverRaw, number> = {
  source: 'lever',
  fetchPage: async page => {
    const res = await apiGet<LeverList>('/lever/people', {
      page: page ?? 1,
      perPage: PAGE_SIZE,
    });
    const next = res.page < res.totalPages ? res.page + 1 : undefined;
    return { items: res.items, nextCursor: next };
  },
  normalize: (raw): Talent => ({
    id: raw.id,
    firstName: raw.name.first,
    lastName: raw.name.last,
    emailAddress: raw.emails[0]?.value ?? '',
    mobilePhone: raw.phones[0]?.value ?? '',
    status: leverStatus(raw),
    skills: raw.tags ?? [],
    city: raw.location?.locality ?? '',
    state: raw.location?.region ?? '',
    lastUpdatedDate: new Date(raw.updatedAt).toISOString(),
  }),
};

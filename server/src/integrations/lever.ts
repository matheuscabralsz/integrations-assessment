import { apiGet } from '../helpers/http.js';
import type { Talent, Status } from '../types.js';

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

type LeverListResponse = {
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

export function toTalent(raw: LeverRaw): Talent {
  return {
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
  };
}

const PAGE_SIZE = 50;
const MAX_PAGES = 50;

export async function fetchAll(): Promise<Talent[]> {
  const out: Talent[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await apiGet<LeverListResponse>('/lever/people', {
      page,
      perPage: PAGE_SIZE,
    });
    for (const r of res.items) out.push(toTalent(r));
    if (page >= res.totalPages) return out;
  }
  return out;
}

import { apiGet } from '../helpers/http.js';
import type { Talent, Status } from '../types.js';

type BullhornRaw = {
  candidate_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employment_status: 'active' | 'inactive' | 'do_not_contact';
  skills: string;
  address?: { city: string; state: string; country_code: string };
  date_last_modified: number;
  date_added: number;
};

type BullhornListResponse = {
  data: BullhornRaw[];
  total: number;
  start: number;
  count: number;
};

const STATUS_MAP: Record<BullhornRaw['employment_status'], Status> = {
  active: 'Active',
  inactive: 'Inactive',
  do_not_contact: 'DoNotContact',
};

export function toTalent(raw: BullhornRaw): Talent {
  return {
    id: String(raw.candidate_id),
    firstName: raw.first_name,
    lastName: raw.last_name,
    emailAddress: raw.email,
    mobilePhone: raw.phone,
    status: STATUS_MAP[raw.employment_status],
    skills: raw.skills.split(',').map(s => s.trim()).filter(Boolean),
    city: raw.address?.city ?? '',
    state: raw.address?.state ?? '',
    lastUpdatedDate: new Date(raw.date_last_modified).toISOString(),
  };
}

const PAGE_SIZE = 50;
const MAX_PAGES = 50;

export async function fetchAll(): Promise<Talent[]> {
  const out: Talent[] = [];
  let start = 0;
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await apiGet<BullhornListResponse>('/bullhorn/candidates', {
      start,
      count: PAGE_SIZE,
    });
    for (const r of res.data) out.push(toTalent(r));
    if (res.data.length === 0 || start + res.data.length >= res.total) return out;
    start += res.data.length;
  }
  return out;
}

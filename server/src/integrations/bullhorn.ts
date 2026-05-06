import { apiGet } from '../helpers/http.js';
import type { Talent, Status } from '../types.js';
import { PAGE_SIZE, type TalentAdapter } from './adapter.js';

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

type BullhornList = {
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

export const bullhorn: TalentAdapter<BullhornRaw, number> = {
  source: 'bullhorn',
  fetchPage: async start => {
    const res = await apiGet<BullhornList>('/bullhorn/candidates', {
      start: start ?? 0,
      count: PAGE_SIZE,
    });
    const next = res.start + res.data.length;
    const done = res.data.length === 0 || next >= res.total;
    return { items: res.data, nextCursor: done ? undefined : next };
  },
  normalize: (raw): Talent => ({
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
  }),
};

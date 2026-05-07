import { apiGet, apiPut } from '../helpers/http.js';
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

type BullhornUpdate = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employment_status?: BullhornRaw['employment_status'];
  address?: { city?: string; state?: string };
};

const STATUS_MAP: Record<BullhornRaw['employment_status'], Status> = {
  active: 'Active',
  inactive: 'Inactive',
  do_not_contact: 'DoNotContact',
};

const STATUS_MAP_INVERSE: Record<Status, BullhornRaw['employment_status']> = {
  Active: 'active',
  Inactive: 'inactive',
  DoNotContact: 'do_not_contact',
};

function normalize(raw: BullhornRaw): Talent {
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

function toRaw(patch: Partial<Talent>): BullhornUpdate {
  const out: BullhornUpdate = {};
  if (patch.firstName !== undefined) out.first_name = patch.firstName;
  if (patch.lastName !== undefined) out.last_name = patch.lastName;
  if (patch.emailAddress !== undefined) out.email = patch.emailAddress;
  if (patch.mobilePhone !== undefined) out.phone = patch.mobilePhone;
  if (patch.status !== undefined) {
    out.employment_status = STATUS_MAP_INVERSE[patch.status];
  }
  if (patch.city !== undefined || patch.state !== undefined) {
    out.address = {};
    if (patch.city !== undefined) out.address.city = patch.city;
    if (patch.state !== undefined) out.address.state = patch.state;
  }
  return out;
}

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
  normalize,
  update: async (id, patch) => {
    const raw = await apiPut<BullhornRaw>(`/bullhorn/candidates/${id}`, toRaw(patch));
    return normalize(raw);
  },
};

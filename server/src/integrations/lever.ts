import { apiGet, apiPut } from '../helpers/http.js';
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

type LeverUpdate = {
  name?: { first?: string; last?: string };
  emails?: { value: string; type: string }[];
  phones?: { value: string; type: string }[];
  isActive?: boolean;
  doNotContact?: boolean;
  location?: { locality?: string; region?: string };
};

const STATUS_TO_LEVER: Record<Status, { isActive?: boolean; doNotContact?: boolean }> = {
  Active: { isActive: true, doNotContact: false },
  Inactive: { isActive: false, doNotContact: false },
  DoNotContact: { doNotContact: true },
};

function leverStatus(raw: LeverRaw): Status {
  if (raw.doNotContact) return 'DoNotContact';
  return raw.isActive ? 'Active' : 'Inactive';
}

function normalize(raw: LeverRaw): Talent {
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

function toRaw(patch: Partial<Talent>): LeverUpdate {
  const out: LeverUpdate = {};
  if (patch.firstName !== undefined || patch.lastName !== undefined) {
    out.name = {};
    if (patch.firstName !== undefined) out.name.first = patch.firstName;
    if (patch.lastName !== undefined) out.name.last = patch.lastName;
  }
  if (patch.emailAddress !== undefined) {
    out.emails = [{ value: patch.emailAddress, type: 'personal' }];
  }
  if (patch.mobilePhone !== undefined) {
    out.phones = [{ value: patch.mobilePhone, type: 'personal' }];
  }
  if (patch.status !== undefined) {
    Object.assign(out, STATUS_TO_LEVER[patch.status]);
  }
  if (patch.city !== undefined || patch.state !== undefined) {
    out.location = {};
    if (patch.city !== undefined) out.location.locality = patch.city;
    if (patch.state !== undefined) out.location.region = patch.state;
  }
  return out;
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
  normalize,
  update: async (id, patch) => {
    const raw = await apiPut<LeverRaw>(`/lever/people/${id}`, toRaw(patch));
    return normalize(raw);
  },
};

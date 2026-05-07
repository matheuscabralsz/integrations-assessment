import { apiGet, apiPut } from '../helpers/http.js';
import type { Talent, Status } from '../types.js';
import { PAGE_SIZE, type TalentAdapter } from './adapter.js';

type AvionteRaw = {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  mobilePhone: string;
  status: Status;
  skills: string[];
  city: string;
  state: string;
  lastUpdatedDate: string;
  createdDate: string;
};

type AvionteList = {
  data: AvionteRaw[];
  nextCursor: string | null;
};

function normalize(raw: AvionteRaw): Talent {
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    emailAddress: raw.emailAddress,
    mobilePhone: raw.mobilePhone,
    status: raw.status,
    skills: raw.skills ?? [],
    city: raw.city,
    state: raw.state,
    lastUpdatedDate: raw.lastUpdatedDate,
  };
}

function toRaw(patch: Partial<Talent>): Partial<AvionteRaw> {
  const out: Partial<AvionteRaw> = {};
  if (patch.firstName !== undefined) out.firstName = patch.firstName;
  if (patch.lastName !== undefined) out.lastName = patch.lastName;
  if (patch.emailAddress !== undefined) out.emailAddress = patch.emailAddress;
  if (patch.mobilePhone !== undefined) out.mobilePhone = patch.mobilePhone;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.city !== undefined) out.city = patch.city;
  if (patch.state !== undefined) out.state = patch.state;
  return out;
}

export const avionte: TalentAdapter<AvionteRaw, string> = {
  source: 'avionte',
  fetchPage: async cursor => {
    const res = await apiGet<AvionteList>('/avionte/talents', {
      limit: PAGE_SIZE,
      cursor,
    });
    return { items: res.data, nextCursor: res.nextCursor ?? undefined };
  },
  normalize,
  update: async (id, patch) => {
    const raw = await apiPut<AvionteRaw>(`/avionte/talents/${id}`, toRaw(patch));
    return normalize(raw);
  },
};

import { apiGet } from '../helpers/http.js';
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

export const avionte: TalentAdapter<AvionteRaw, string> = {
  source: 'avionte',
  fetchPage: async cursor => {
    const res = await apiGet<AvionteList>('/avionte/talents', {
      limit: PAGE_SIZE,
      cursor,
    });
    return { items: res.data, nextCursor: res.nextCursor ?? undefined };
  },
  normalize: (raw): Talent => ({
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
  }),
};

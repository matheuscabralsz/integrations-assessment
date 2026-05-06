import { apiGet } from '../helpers/http.js';
import type { Talent, Status } from '../types.js';

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

type AvionteListResponse = {
  data: AvionteRaw[];
  nextCursor: string | null;
};

export function toTalent(raw: AvionteRaw): Talent {
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

const PAGE_SIZE = 50;
const MAX_PAGES = 50;

export async function fetchAll(): Promise<Talent[]> {
  const out: Talent[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await apiGet<AvionteListResponse>('/avionte/talents', {
      limit: PAGE_SIZE,
      cursor,
    });
    for (const r of res.data) out.push(toTalent(r));
    if (!res.nextCursor) return out;
    cursor = res.nextCursor;
  }
  return out;
}

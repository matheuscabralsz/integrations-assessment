export type Status = 'Active' | 'Inactive' | 'DoNotContact';

export type Talent = {
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
};

export type Source = 'avionte' | 'bullhorn' | 'lever';

export type TalentRow = Talent & { source: Source };

export type IntegrationError = {
  source: Source;
  message: string;
  code?: string;
  status?: number;
};

export type TalentsResponse = {
  talents: TalentRow[];
  errors: IntegrationError[];
};

export type SyncDetail =
  | { id: string; status: 'created' | 'updated' | 'unchanged' }
  | { id: string; status: 'conflict'; message: string; serverVersion: { lastUpdatedDate: string } }
  | { id: string; status: 'error'; message: string };

export type SyncSummary = {
  total: number;
  created: number;
  updated: number;
  unchanged: number;
  conflicts: number;
  errors: number;
};

export type SyncResponse = {
  summary: SyncSummary;
  details: SyncDetail[];
};

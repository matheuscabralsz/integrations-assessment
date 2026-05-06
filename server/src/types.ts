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

export type IntegrationError = {
  source: Source;
  message: string;
  code?: string;
  status?: number;
};

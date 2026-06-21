export type Role = 'admin' | 'team_leader' | 'sales_rep';

export type SaleStatus = 'Confirmed' | 'QC Open' | 'Cancelled' | 'In Progress';
export type SaleType = 'SUCU' | 'LUSU' | 'SUCN' | 'SNCN' | 'LUSN' | 'LUSD' | 'BNTP' | 'BNDP';
export type PkGk = 'PK' | 'GK';
export type BkNk = 'BK' | 'NK';
export type Marketing = 'VVM' | 'NVM' | 'RVM';

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  repId?: string;
  teamIds?: string[];
};

export type Team = {
  id: string;
  name: string;
  area: string;
  monthlyPointGoal: number;
  leaderIds: string[];
};

export type SalesRep = {
  id: string;
  name: string;
  teamId: string;
  role: 'Team Leader' | 'Sales Rep';
  active: boolean;
  joined: string;
  monthlyPointBudget: number;
};

export type SaleOrder = {
  id: string;
  date: string;
  repId: string;
  teamId: string;
  pkGk: PkGk;
  product: string;
  transitionProduct: string;
  saleType: SaleType;
  bkNk: BkNk;
  marketing: Marketing;
  fiberNeu: boolean;
  points: number;
  status: SaleStatus;
  comment: string;
};

export type Filters = {
  startDate: string;
  endDate: string;
  teamId: string;
  repId: string;
  status: string;
  saleType: string;
  marketing: string;
  search: string;
};

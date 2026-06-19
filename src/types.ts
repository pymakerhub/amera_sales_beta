export type Role = 'admin' | 'team_leader' | 'sales_rep';

export type SaleStatus = 'Confirmed' | 'QC Open' | 'Cancelled' | 'Pending' | 'Not claimable';

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
  monthlyGoal: number;
  leaderIds: string[];
};

export type SalesRep = {
  id: string;
  name: string;
  teamId: string;
  role: 'Team Leader' | 'Sales Rep';
  active: boolean;
  joined: string;
};

export type SaleOrder = {
  id: string;
  date: string;
  repId: string;
  teamId: string;
  customerLabel: string;
  address: string;
  project: string;
  area: string;
  product: string;
  status: SaleStatus;
  claimable: boolean;
  contactedAddresses: number;
  comment: string;
};

export type Filters = {
  startDate: string;
  endDate: string;
  teamId: string;
  repId: string;
  status: string;
  project: string;
  search: string;
};

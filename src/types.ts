export type Role = 'admin' | 'team_leader' | 'sales_rep';

export type SaleStatus = 'Confirmed' | 'QC Open' | 'Cancelled' | 'In Progress' | 'Not claimable';
export type SaleType = 'Neutral' | 'SpeedUp' | 'ContentUp' | 'LayerUp';
export type FiberPhase = 'None' | 'NVM / RVM Fiber Neu';
export type ConnectionType = 'None' | 'NK' | 'GK';

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
  customerLabel: string;
  address: string;
  area: string;
  product: string;
  saleType: SaleType;
  connectionType: ConnectionType;
  fiberPhase: FiberPhase;
  points: number;
  status: SaleStatus;
  claimable: boolean;
  comment: string;
};

export type Filters = {
  startDate: string;
  endDate: string;
  teamId: string;
  repId: string;
  status: string;
  saleType: string;
  search: string;
};

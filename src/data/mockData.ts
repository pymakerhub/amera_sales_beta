import { ConnectionType, FiberPhase, SaleOrder, SalesRep, SaleType, Team, User } from '../types';

export const users: User[] = [
  { id: 'u-axel', name: 'Axel', username: 'axel', password: 'beta123', role: 'admin' },
  { id: 'u-aleksander', name: 'Aleksander', username: 'aleksander', password: 'beta123', role: 'admin' },
  { id: 'u-luis', name: 'Luis', username: 'luis', password: 'beta123', role: 'admin' },
];

export const teams: Team[] = [
  { id: 'team-oslo', name: 'Oslo North', area: 'Oslo', monthlyPointGoal: 420, leaderIds: ['rep-ingrid'] },
  { id: 'team-bergen', name: 'Bergen West', area: 'Vestland', monthlyPointGoal: 380, leaderIds: ['rep-marius'] },
  { id: 'team-trondheim', name: 'Trondheim Field', area: 'Trondelag', monthlyPointGoal: 340, leaderIds: ['rep-sara'] },
  { id: 'team-stavanger', name: 'Stavanger South', area: 'Rogaland', monthlyPointGoal: 315, leaderIds: ['rep-jonas'] },
];

export const reps: SalesRep[] = [
  { id: 'rep-ingrid', name: 'Ingrid Nilsen', teamId: 'team-oslo', role: 'Team Leader', active: true, joined: '2023-01-16', monthlyPointBudget: 145 },
  { id: 'rep-emil', name: 'Emil Berg', teamId: 'team-oslo', role: 'Sales Rep', active: true, joined: '2024-03-04', monthlyPointBudget: 130 },
  { id: 'rep-nora', name: 'Nora Solheim', teamId: 'team-oslo', role: 'Sales Rep', active: true, joined: '2024-08-12', monthlyPointBudget: 120 },
  { id: 'rep-marius', name: 'Marius Holm', teamId: 'team-bergen', role: 'Team Leader', active: true, joined: '2022-11-01', monthlyPointBudget: 140 },
  { id: 'rep-thea', name: 'Thea Larsen', teamId: 'team-bergen', role: 'Sales Rep', active: true, joined: '2023-09-18', monthlyPointBudget: 125 },
  { id: 'rep-oliver', name: 'Oliver Dahl', teamId: 'team-bergen', role: 'Sales Rep', active: true, joined: '2025-01-08', monthlyPointBudget: 115 },
  { id: 'rep-sara', name: 'Sara Moen', teamId: 'team-trondheim', role: 'Team Leader', active: true, joined: '2023-05-22', monthlyPointBudget: 132 },
  { id: 'rep-henrik', name: 'Henrik Aas', teamId: 'team-trondheim', role: 'Sales Rep', active: true, joined: '2024-10-14', monthlyPointBudget: 112 },
  { id: 'rep-karoline', name: 'Karoline Vik', teamId: 'team-trondheim', role: 'Sales Rep', active: true, joined: '2025-02-03', monthlyPointBudget: 105 },
  { id: 'rep-jonas', name: 'Jonas Eide', teamId: 'team-stavanger', role: 'Team Leader', active: true, joined: '2022-06-13', monthlyPointBudget: 126 },
  { id: 'rep-amalie', name: 'Amalie Ravn', teamId: 'team-stavanger', role: 'Sales Rep', active: true, joined: '2024-04-29', monthlyPointBudget: 102 },
  { id: 'rep-sander', name: 'Sander Lie', teamId: 'team-stavanger', role: 'Sales Rep', active: true, joined: '2025-03-17', monthlyPointBudget: 96 },
];

export const saleTypes: SaleType[] = ['Neutral', 'SpeedUp', 'ContentUp', 'LayerUp'];
export const connectionTypes: ConnectionType[] = ['None', 'NK', 'GK'];
export const fiberPhases: FiberPhase[] = ['None', 'NVM / RVM Fiber Neu'];

export const pointRules = [
  { label: 'Neutral', points: 1 },
  { label: 'SpeedUp', points: 2 },
  { label: 'ContentUp', points: 2 },
  { label: 'LayerUp', points: 3 },
  { label: 'NK', points: 5 },
  { label: 'GK', points: 3 },
  { label: 'NVM / RVM Fiber Neu', points: 5 },
];

export function calculateAmeraPoints(saleType: SaleType, connectionType: ConnectionType, fiberPhase: FiberPhase): number {
  const saleTypePoints: Record<SaleType, number> = {
    Neutral: 1,
    SpeedUp: 2,
    ContentUp: 2,
    LayerUp: 3,
  };
  const connectionPoints: Record<ConnectionType, number> = {
    None: 0,
    NK: 5,
    GK: 3,
  };
  return saleTypePoints[saleType] + connectionPoints[connectionType] + (fiberPhase === 'NVM / RVM Fiber Neu' ? 5 : 0);
}

const names = ['Demo Household', 'Sample Residence', 'Test Family', 'Beta Address', 'Pilot Home', 'Training Lead'];
const streets = ['Maple Gate', 'Harbor Lane', 'Fjord Road', 'Market Street', 'Station View', 'Park Terrace'];
const products = ['Fiber 500', 'Fiber 1000', 'TV + Fiber', 'Mobile Bundle', 'Upgrade Pack'];
const comments = [
  'Confirmed with standard beta paperwork.',
  'Customer chose UP package during callback.',
  'Fiber Neu bonus applies for this dummy case.',
  'Needs QC review before points become final.',
  'Cancelled after demo price comparison.',
  'In progress before points are final.',
  'Not claimable: duplicate demo address.',
];

const statusPattern = ['Confirmed', 'Confirmed', 'Confirmed', 'QC Open', 'In Progress', 'Cancelled', 'Not claimable'] as const;

export const orders: SaleOrder[] = Array.from({ length: 96 }, (_, index) => {
  const rep = reps[index % reps.length];
  const dayOffset = 47 - index;
  const date = new Date(Date.UTC(2026, 5, 18 - dayOffset));
  const status = statusPattern[index % statusPattern.length];
  const saleType = saleTypes[index % saleTypes.length];
  const connectionType = connectionTypes[(index + 1) % connectionTypes.length];
  const fiberPhase = index % 5 === 0 || index % 11 === 0 ? 'NVM / RVM Fiber Neu' : 'None';
  const isClaimable = status === 'Confirmed' || status === 'In Progress';
  return {
    id: `DEMO-${String(index + 1).padStart(4, '0')}`,
    date: date.toISOString().slice(0, 10),
    repId: rep.id,
    teamId: rep.teamId,
    customerLabel: `${names[index % names.length]} ${index + 1}`,
    address: `${100 + index} ${streets[index % streets.length]}, Demo City`,
    area: teams.find((team) => team.id === rep.teamId)?.area ?? 'Demo Area',
    product: products[(index + 2) % products.length],
    saleType,
    connectionType,
    fiberPhase,
    points: isClaimable ? calculateAmeraPoints(saleType, connectionType, fiberPhase) : 0,
    status,
    claimable: isClaimable,
    comment: comments[index % comments.length],
  };
});

export const statuses = ['Confirmed', 'QC Open', 'Cancelled', 'In Progress', 'Not claimable'] as const;

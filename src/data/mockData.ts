import { SaleOrder, SalesRep, Team, User } from '../types';

export const users: User[] = [
  { id: 'u-axel', name: 'Axel', username: 'axel', password: 'beta123', role: 'admin' },
  { id: 'u-aleksander', name: 'Aleksander', username: 'aleksander', password: 'beta123', role: 'admin' },
  { id: 'u-luis', name: 'Luis', username: 'luis', password: 'beta123', role: 'admin' },
];

export const teams: Team[] = [
  { id: 'team-oslo', name: 'Oslo North', area: 'Oslo', monthlyGoal: 95, leaderIds: ['rep-ingrid'] },
  { id: 'team-bergen', name: 'Bergen West', area: 'Vestland', monthlyGoal: 82, leaderIds: ['rep-marius'] },
  { id: 'team-trondheim', name: 'Trondheim Field', area: 'Trondelag', monthlyGoal: 74, leaderIds: ['rep-sara'] },
  { id: 'team-stavanger', name: 'Stavanger South', area: 'Rogaland', monthlyGoal: 68, leaderIds: ['rep-jonas'] },
];

export const reps: SalesRep[] = [
  { id: 'rep-ingrid', name: 'Ingrid Nilsen', teamId: 'team-oslo', role: 'Team Leader', active: true, joined: '2023-01-16' },
  { id: 'rep-emil', name: 'Emil Berg', teamId: 'team-oslo', role: 'Sales Rep', active: true, joined: '2024-03-04' },
  { id: 'rep-nora', name: 'Nora Solheim', teamId: 'team-oslo', role: 'Sales Rep', active: true, joined: '2024-08-12' },
  { id: 'rep-marius', name: 'Marius Holm', teamId: 'team-bergen', role: 'Team Leader', active: true, joined: '2022-11-01' },
  { id: 'rep-thea', name: 'Thea Larsen', teamId: 'team-bergen', role: 'Sales Rep', active: true, joined: '2023-09-18' },
  { id: 'rep-oliver', name: 'Oliver Dahl', teamId: 'team-bergen', role: 'Sales Rep', active: true, joined: '2025-01-08' },
  { id: 'rep-sara', name: 'Sara Moen', teamId: 'team-trondheim', role: 'Team Leader', active: true, joined: '2023-05-22' },
  { id: 'rep-henrik', name: 'Henrik Aas', teamId: 'team-trondheim', role: 'Sales Rep', active: true, joined: '2024-10-14' },
  { id: 'rep-karoline', name: 'Karoline Vik', teamId: 'team-trondheim', role: 'Sales Rep', active: true, joined: '2025-02-03' },
  { id: 'rep-jonas', name: 'Jonas Eide', teamId: 'team-stavanger', role: 'Team Leader', active: true, joined: '2022-06-13' },
  { id: 'rep-amalie', name: 'Amalie Ravn', teamId: 'team-stavanger', role: 'Sales Rep', active: true, joined: '2024-04-29' },
  { id: 'rep-sander', name: 'Sander Lie', teamId: 'team-stavanger', role: 'Sales Rep', active: true, joined: '2025-03-17' },
];

const names = ['Demo Household', 'Sample Residence', 'Test Family', 'Beta Address', 'Pilot Home', 'Training Lead'];
const streets = ['Maple Gate', 'Harbor Lane', 'Fjord Road', 'Market Street', 'Station View', 'Park Terrace'];
const products = ['Fiber 500', 'Fiber 1000', 'TV + Fiber', 'Mobile Bundle', 'Upgrade Pack'];
const projects = ['Brownfield', 'Greenfield', 'Winback', 'Upgrade', 'Event Stand'];
const comments = [
  'Confirmed during evening callback.',
  'Customer asked for installation window follow-up.',
  'Address needs QC review before claim.',
  'Cancelled after price comparison.',
  'Pending landlord approval.',
  'Not claimable: duplicate demo address.',
];

const statusPattern = ['Confirmed', 'Confirmed', 'Confirmed', 'QC Open', 'Pending', 'Cancelled', 'Not claimable'] as const;

export const orders: SaleOrder[] = Array.from({ length: 84 }, (_, index) => {
  const rep = reps[index % reps.length];
  const dayOffset = 41 - index;
  const date = new Date(Date.UTC(2026, 5, 18 - dayOffset));
  const status = statusPattern[index % statusPattern.length];
  const project = projects[(index + rep.name.length) % projects.length];
  return {
    id: `DEMO-${String(index + 1).padStart(4, '0')}`,
    date: date.toISOString().slice(0, 10),
    repId: rep.id,
    teamId: rep.teamId,
    customerLabel: `${names[index % names.length]} ${index + 1}`,
    address: `${100 + index} ${streets[index % streets.length]}, Demo City`,
    project,
    area: teams.find((team) => team.id === rep.teamId)?.area ?? 'Demo Area',
    product: products[(index + 2) % products.length],
    status,
    claimable: status === 'Confirmed' || status === 'QC Open' || status === 'Pending',
    contactedAddresses: 8 + (index % 9),
    comment: comments[index % comments.length],
  };
});

export const projectsList = projects;
export const statuses = ['Confirmed', 'QC Open', 'Cancelled', 'Pending', 'Not claimable'] as const;

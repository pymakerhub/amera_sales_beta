import { Filters, SaleOrder, SalesRep, SaleStatus, Team, User } from '../types';

export const today = '2026-06-19';

export const initialFilters: Filters = {
  startDate: '2026-06-01',
  endDate: today,
  teamId: 'all',
  repId: 'all',
  status: 'all',
  project: 'all',
  search: '',
};

export function visibleOrdersForUser(orders: SaleOrder[], user: User | null): SaleOrder[] {
  if (!user) return [];
  if (user.role === 'admin') return orders;
  if (user.role === 'team_leader') return orders.filter((order) => user.teamIds?.includes(order.teamId));
  return orders.filter((order) => order.repId === user.repId);
}

export function applyFilters(orders: SaleOrder[], filters: Filters): SaleOrder[] {
  const search = filters.search.trim().toLowerCase();
  return orders.filter((order) => {
    const inDate = order.date >= filters.startDate && order.date <= filters.endDate;
    const teamMatch = filters.teamId === 'all' || order.teamId === filters.teamId;
    const repMatch = filters.repId === 'all' || order.repId === filters.repId;
    const statusMatch = filters.status === 'all' || order.status === filters.status;
    const projectMatch = filters.project === 'all' || order.project === filters.project;
    const searchMatch =
      !search ||
      [order.id, order.customerLabel, order.address, order.project, order.product, order.status, order.comment]
        .join(' ')
        .toLowerCase()
        .includes(search);
    return inDate && teamMatch && repMatch && statusMatch && projectMatch && searchMatch;
  });
}

export function countByStatus(orders: SaleOrder[], status: SaleStatus): number {
  return orders.filter((order) => order.status === status).length;
}

export function getMetrics(orders: SaleOrder[]) {
  const total = orders.length;
  const confirmed = countByStatus(orders, 'Confirmed');
  const cancelled = countByStatus(orders, 'Cancelled');
  const qcOpen = countByStatus(orders, 'QC Open');
  const pending = countByStatus(orders, 'Pending');
  const notClaimable = countByStatus(orders, 'Not claimable');
  const net = confirmed + qcOpen + pending - cancelled;
  const contacted = orders.reduce((sum, order) => sum + order.contactedAddresses, 0);
  const takeRate = contacted ? Math.round((confirmed / contacted) * 1000) / 10 : 0;
  return { total, confirmed, cancelled, qcOpen, pending, notClaimable, net, takeRate };
}

export function repName(reps: SalesRep[], repId: string): string {
  return reps.find((rep) => rep.id === repId)?.name ?? 'Unknown rep';
}

export function teamName(teams: Team[], teamId: string): string {
  return teams.find((team) => team.id === teamId)?.name ?? 'Unknown team';
}

export function periodBounds(period: string): { start: string; end: string; label: string } {
  if (period === 'day') return { start: '2026-06-18', end: '2026-06-18', label: 'Day' };
  if (period === 'week') return { start: '2026-06-15', end: today, label: 'Week' };
  if (period === 'month') return { start: '2026-06-01', end: today, label: 'Month' };
  if (period === 'year') return { start: '2026-01-01', end: today, label: 'Year' };
  return { start: '1900-01-01', end: today, label: 'All Time' };
}

export function ordersInPeriod(orders: SaleOrder[], period: string): SaleOrder[] {
  const bounds = periodBounds(period);
  return orders.filter((order) => order.date >= bounds.start && order.date <= bounds.end);
}

export function confirmedCount(orders: SaleOrder[]): number {
  return orders.filter((order) => order.status === 'Confirmed').length;
}

export function rankReps(orders: SaleOrder[], reps: SalesRep[]) {
  return reps
    .map((rep) => {
      const repOrders = orders.filter((order) => order.repId === rep.id);
      return {
        id: rep.id,
        name: rep.name,
        teamId: rep.teamId,
        confirmed: confirmedCount(repOrders),
        cancellations: countByStatus(repOrders, 'Cancelled'),
        qcOpen: countByStatus(repOrders, 'QC Open'),
        total: repOrders.length,
      };
    })
    .sort((a, b) => b.confirmed - a.confirmed || a.cancellations - b.cancellations);
}

export function rankTeams(orders: SaleOrder[], teams: Team[]) {
  return teams
    .map((team) => {
      const teamOrders = orders.filter((order) => order.teamId === team.id);
      return {
        id: team.id,
        name: team.name,
        confirmed: confirmedCount(teamOrders),
        cancellations: countByStatus(teamOrders, 'Cancelled'),
        qcOpen: countByStatus(teamOrders, 'QC Open'),
        total: teamOrders.length,
        goal: team.monthlyGoal,
      };
    })
    .sort((a, b) => b.confirmed - a.confirmed || a.cancellations - b.cancellations);
}

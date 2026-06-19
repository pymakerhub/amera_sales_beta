import { Filters, SaleOrder, SalesRep, SaleStatus, Team, User } from '../types';

export const today = '2026-06-19';

export const initialFilters: Filters = {
  startDate: '2026-06-01',
  endDate: today,
  teamId: 'all',
  repId: 'all',
  status: 'all',
  saleType: 'all',
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
    const saleTypeMatch = filters.saleType === 'all' || order.saleType === filters.saleType;
    const searchMatch =
      !search ||
      [
        order.id,
        order.saleType,
        order.pkGk,
        order.bkNk,
        order.marketing,
        order.fiberNeu ? 'Fiber Neu yes' : 'Fiber Neu no',
        order.transitionProduct,
        order.product,
        order.status,
        order.comment,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    return inDate && teamMatch && repMatch && statusMatch && saleTypeMatch && searchMatch;
  });
}

export function countByStatus(orders: SaleOrder[], status: SaleStatus): number {
  return orders.filter((order) => order.status === status).length;
}

export function pointTotal(orders: SaleOrder[]): number {
  return orders.reduce((sum, order) => sum + order.points, 0);
}

export function getMetrics(orders: SaleOrder[]) {
  const totalSales = orders.length;
  const confirmed = countByStatus(orders, 'Confirmed');
  const cancelled = countByStatus(orders, 'Cancelled');
  const qcOpen = countByStatus(orders, 'QC Open');
  const inProgress = countByStatus(orders, 'In Progress');
  const points = pointTotal(orders);
  const scoringSales = orders.filter((order) => order.points > 0).length;
  const averagePoints = totalSales ? Math.round((points / totalSales) * 10) / 10 : 0;
  return { totalSales, confirmed, cancelled, qcOpen, inProgress, points, scoringSales, averagePoints };
}

export function repName(reps: SalesRep[], repId: string): string {
  return reps.find((rep) => rep.id === repId)?.name ?? 'Unknown rep';
}

export function shortRepName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function teamName(teams: Team[], teamId: string): string {
  return teams.find((team) => team.id === teamId)?.name ?? 'Unknown team';
}

export function periodBounds(period: string): { start: string; end: string; label: string } {
  if (period === 'yesterday') return { start: '2026-06-18', end: '2026-06-18', label: 'Yesterday' };
  if (period === 'current') return { start: today, end: today, label: 'Current' };
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
      const points = pointTotal(repOrders);
      return {
        id: rep.id,
        name: rep.name,
        teamId: rep.teamId,
        points,
        budget: rep.monthlyPointBudget,
        budgetProgress: Math.round((points / Math.max(rep.monthlyPointBudget, 1)) * 100),
        confirmed: confirmedCount(repOrders),
        cancellations: countByStatus(repOrders, 'Cancelled'),
        qcOpen: countByStatus(repOrders, 'QC Open'),
        total: repOrders.length,
      };
    })
    .sort((a, b) => b.points - a.points || b.confirmed - a.confirmed || a.cancellations - b.cancellations);
}

export function rankTeams(orders: SaleOrder[], teams: Team[]) {
  return teams
    .map((team) => {
      const teamOrders = orders.filter((order) => order.teamId === team.id);
      const points = pointTotal(teamOrders);
      return {
        id: team.id,
        name: team.name,
        points,
        confirmed: confirmedCount(teamOrders),
        cancellations: countByStatus(teamOrders, 'Cancelled'),
        qcOpen: countByStatus(teamOrders, 'QC Open'),
        total: teamOrders.length,
        goal: team.monthlyPointGoal,
      };
    })
    .sort((a, b) => b.points - a.points || b.confirmed - a.confirmed || a.cancellations - b.cancellations);
}

export function allTimeHighs(orders: SaleOrder[], reps: SalesRep[], teams: Team[]) {
  const periods = ['yesterday', 'week', 'month', 'year', 'all'];
  return periods.map((period) => {
    const periodOrders = ordersInPeriod(orders, period);
    const topRep = rankReps(periodOrders, reps)[0];
    const topTeam = rankTeams(periodOrders, teams)[0];
    return {
      period,
      topRep,
      topTeam,
      label: periodBounds(period).label,
    };
  });
}

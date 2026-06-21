import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { marketingTypes, orders, pointRules, reps, saleTypes, statuses, teams, users } from './data/mockData';
import { Filters, SaleOrder, User } from './types';
import {
  allTimeHighs,
  applyFilters,
  getMetrics,
  initialFilters,
  ordersInPeriod,
  pointTotal,
  rankReps,
  rankTeams,
  repName,
  shortRepName,
  visibleOrdersForUser,
} from './utils/metrics';
import './styles.css';

type Page = 'dashboard' | 'team-leader' | 'admin-sales' | 'leaderboard' | 'records' | 'overview';
type PeriodMode = 'custom' | 'week' | 'month' | 'year';
type CarouselPeriod = 'yesterday' | 'week' | 'month' | 'year' | 'all';

const navItems: { page: Page; label: string; roles: User['role'][] }[] = [
  { page: 'dashboard', label: 'Control Panel', roles: ['admin', 'team_leader', 'sales_rep'] },
  { page: 'admin-sales', label: 'All Sales', roles: ['admin', 'team_leader', 'sales_rep'] },
  { page: 'team-leader', label: 'Team Leader', roles: ['admin', 'team_leader'] },
  { page: 'leaderboard', label: 'Hall of Fame', roles: ['admin', 'team_leader', 'sales_rep'] },
  { page: 'records', label: 'All-Time Highs', roles: ['admin', 'team_leader', 'sales_rep'] },
  { page: 'overview', label: 'Current App Overview', roles: ['admin'] },
];

const carouselPeriods: CarouselPeriod[] = ['yesterday', 'week', 'month', 'year', 'all'];
const periodLabels: Record<CarouselPeriod, string> = {
  yesterday: 'Yesterday',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  all: 'All Time',
};

function allowedNavItems(user: User) {
  return navItems.filter((item) => item.roles.includes(user.role));
}

function teamsForUser(user: User) {
  if (user.role === 'admin') return teams;
  if (user.role === 'team_leader') return teams.filter((team) => user.teamIds?.includes(team.id));
  const rep = reps.find((candidate) => candidate.id === user.repId);
  return rep ? teams.filter((team) => team.id === rep.teamId) : [];
}

function repsForUser(user: User) {
  if (user.role === 'admin') return reps;
  if (user.role === 'team_leader') return reps.filter((rep) => user.teamIds?.includes(rep.teamId));
  return reps.filter((rep) => rep.id === user.repId);
}

function sanitizePage(page: Page, user: User): Page {
  return allowedNavItems(user).some((item) => item.page === page) ? page : 'dashboard';
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('amera-user');
    return saved ? (JSON.parse(saved) as User) : null;
  });
  const [page, setPage] = useState<Page>('dashboard');

  function handleLogin(nextUser: User) {
    setUser(nextUser);
    localStorage.setItem('amera-user', JSON.stringify(nextUser));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('amera-user');
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;
  const safePage = sanitizePage(page, user);
  const visibleNav = allowedNavItems(user);

  return (
    <div className="app-shell">
      <header className="topbar">
        <BrandLogo caption="Salesboard beta" />
        <nav className="main-nav">
          {visibleNav.map((item) => (
            <button key={item.page} className={safePage === item.page ? 'active' : ''} onClick={() => setPage(item.page)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="user-strip">
          <span>{shortRepName(user.name)}</span>
          <small>{user.role.replace('_', ' ')}</small>
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main>
        <Header user={user} />
        {safePage === 'dashboard' && <Dashboard user={user} />}
        {safePage === 'team-leader' && <TeamLeader user={user} />}
        {safePage === 'admin-sales' && <AdminSales user={user} />}
        {safePage === 'leaderboard' && <Leaderboard user={user} />}
        {safePage === 'records' && <AllTimeHighRecords user={user} />}
        {safePage === 'overview' && <Overview />}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = users.find((candidate) => candidate.username === username.trim().toLowerCase() && candidate.password === password);
    if (!found) {
      setError('Incorrect beta username or password.');
      return;
    }
    onLogin(found);
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <BrandLogo caption="Beta reporting demo" login />
        <form onSubmit={submit}>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Log in</button>
        </form>
        <p className="demo-note">Mock login for beta testing only. Credentials are documented in the README, not shown here.</p>
      </section>
    </main>
  );
}

function BrandLogo({ caption, login = false }: { caption: string; login?: boolean }) {
  return (
    <div className={`brand ${login ? 'login-brand' : ''}`}>
      <img className="amera-wordmark" src="./amera-wordmark.svg" alt="Amera" />
      <span>{caption}</span>
    </div>
  );
}

function Header({ user }: { user: User }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Amera beta control panel</p>
        <h1>Sales reporting cockpit</h1>
      </div>
      <div className="access-strip">
        <span>Sales reps: own sales</span>
        <span>Team leaders: assigned teams</span>
        <span className={user.role === 'admin' ? 'highlight' : ''}>Admins: all sales</span>
      </div>
    </header>
  );
}

function Dashboard({ user }: { user: User }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const visible = visibleOrdersForUser(orders, user);
  const filtered = applyFilters(visible, filters);
  const metrics = getMetrics(filtered);
  const scopedTeams = teamsForUser(user);
  const scopedReps = repsForUser(user);
  const rankedTeams = rankTeams(filtered, scopedTeams).slice(0, 4);
  const rankedReps = rankReps(filtered, scopedReps).slice(0, 6);
  const dashboardSubtitle =
    user.role === 'sales_rep'
      ? 'Your dashboard shows only your own sales and point budget.'
      : user.role === 'team_leader'
        ? 'Your dashboard shows only your assigned team members and team performance.'
        : 'Admin dashboard includes all dummy teams and sales reps.';

  return (
    <PageSection title="Control Panel" subtitle={dashboardSubtitle}>
      <FiltersBar filters={filters} setFilters={setFilters} includeSearch={false} user={user} showTeamFilter={user.role !== 'sales_rep'} showRepFilter={user.role !== 'sales_rep'} includePeriodPicker />
      <div className="kpi-grid">
        <Kpi label="Amera Points" value={metrics.points} tone="good" />
        <Kpi label="Total Sales" value={metrics.totalSales} />
        <Kpi label="Avg Points / Sale" value={metrics.averagePoints} />
        <Kpi label="In Progress" value={metrics.inProgress} />
        <Kpi label="Cancelled" value={metrics.cancelled} tone="bad" />
        <Kpi label="QC Open" value={metrics.qcOpen} tone="warn" />
      </div>
      <div className="split">
        {user.role === 'sales_rep' ? (
          <Card title="Your Point Budget">
            {scopedReps.map((rep) => {
              const repPoints = pointTotal(filtered.filter((order) => order.repId === rep.id));
              return <ProgressRow key={rep.id} label={shortRepName(rep.name)} value={repPoints} max={rep.monthlyPointBudget} detail={`${repPoints}/${rep.monthlyPointBudget} points`} />;
            })}
          </Card>
        ) : (
          <TeamControlPanel teams={rankedTeams} scopedReps={scopedReps} />
        )}
        {user.role !== 'sales_rep' && (
          <Card title="Rep Point Progress">
            {rankedReps.map((rep) => (
              <ProgressRow key={rep.id} label={shortRepName(rep.name)} value={rep.points} max={rep.budget} detail={`${rep.points}/${rep.budget} points`} />
            ))}
          </Card>
        )}
        <Card title="Amera-Point System">
          <div className="rules-grid">
            {pointRules.map((rule) => (
              <div key={rule.label}>
                <span>{rule.label}</span>
                <strong>{rule.points > 0 ? `+${rule.points}` : rule.points}</strong>
              </div>
            ))}
          </div>
          <div className="examples-list">
            <p>VVM NK without UP = 5 Amera Points</p>
            <p>VVM NK with UP Speedup = 7 Amera Points</p>
            <p>NVM NK = 10 Amera points (NK + NVM Fiber Neu)</p>
            <p>NVM Fiber Neu Neutral = 6 Amera Points (NVM Fiber Neu + BK Neutral)</p>
            <p>NVM GK NK Fiber Neu =13 Amera Points</p>
          </div>
        </Card>
        <Card title="Status Mix">
          {statuses.map((status) => (
            <ProgressRow key={status} label={status} value={filtered.filter((order) => order.status === status).length} max={Math.max(filtered.length, 1)} />
          ))}
        </Card>
      </div>
    </PageSection>
  );
}

function TeamControlPanel({
  teams: rankedTeams,
  scopedReps,
}: {
  teams: ReturnType<typeof rankTeams>;
  scopedReps: ReturnType<typeof repsForUser>;
}) {
  const totalGoal = rankedTeams.reduce((sum, team) => sum + team.goal, 0);
  const totalPoints = rankedTeams.reduce((sum, team) => sum + team.points, 0);
  const totalProgress = Math.min(100, Math.round((totalPoints / Math.max(totalGoal, 1)) * 100));
  const colors = ['#2ff07f', '#58bde6', '#f23dc3', '#ffc655'];
  const slices = rankedTeams.map((team) => Math.max(4, Math.round((team.goal / Math.max(totalGoal, 1)) * 100)));

  return (
    <section className="legacy-control">
      <div className="donut-panel">
        <DonutGoal value={totalProgress} slices={slices} colors={colors} />
        <DonutLegend teams={rankedTeams} totalGoal={totalGoal} colors={colors} />
      </div>
      <div className="legacy-table-wrap">
        <table className="legacy-table">
          <thead>
            <tr>
              <th>Teams</th>
              <th>Members</th>
              <th>Goal</th>
              <th>Sales</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rankedTeams.map((team) => {
              const progress = Math.min(100, Math.round((team.points / Math.max(team.goal, 1)) * 100));
              const members = scopedReps.filter((rep) => rep.teamId === team.id).map((rep) => rep.name.split(' ')[0]);
              return (
                <tr key={team.id}>
                  <td>
                    <strong>{team.name}</strong>
                  </td>
                  <td>{members.join(', ')}</td>
                  <td>
                    <strong>{team.goal}</strong>
                  </td>
                  <td>
                    {team.points} <span>({Math.round((team.points / 19) * 10) / 10}/day)</span>
                  </td>
                  <td>
                    <ProgressPill value={progress} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DonutLegend({
  teams: rankedTeams,
  totalGoal,
  colors,
}: {
  teams: ReturnType<typeof rankTeams>;
  totalGoal: number;
  colors: string[];
}) {
  return (
    <div className="donut-legend">
      {rankedTeams.map((team, index) => (
        <span key={team.id}>
          <i style={{ background: colors[index % colors.length] }} />
          <b>{team.name}</b>
          <em>{Math.round((team.goal / Math.max(totalGoal, 1)) * 100)}%</em>
        </span>
      ))}
    </div>
  );
}

function DonutGoal({ value, slices, colors }: { value: number; slices: number[]; colors: string[] }) {
  let cursor = 0;
  const gradient = slices
    .map((slice, index) => {
      const start = cursor;
      cursor += slice;
      return `${colors[index % colors.length]} ${start}% ${cursor}%`;
    })
    .join(', ');
  return (
    <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="donut-core">
        <strong>Total Goal</strong>
        <span className="donut-meter">
          <i style={{ width: `${value}%` }} />
        </span>
        <b>{value}%</b>
      </div>
    </div>
  );
}

function ProgressPill({ value }: { value: number }) {
  const visibleValue = value > 0 ? Math.max(value, 24) : 0;
  return (
    <span className="progress-pill">
      <i style={{ width: `${visibleValue}%` }} />
      <b>{value}%</b>
    </span>
  );
}

function TeamLeader({ user }: { user: User }) {
  const [teamId, setTeamId] = useState(teams[0].id);
  const allowedTeamIds = user.role === 'team_leader' ? user.teamIds ?? [] : [teamId];
  const scopedOrders = orders.filter((order) => allowedTeamIds.includes(order.teamId));
  const scopedReps = reps.filter((rep) => allowedTeamIds.includes(rep.teamId));
  const ranking = rankReps(scopedOrders, scopedReps);
  const week = scopedOrders.filter((order) => order.date >= '2026-06-15');
  const month = scopedOrders.filter((order) => order.date >= '2026-06-01');

  return (
    <PageSection title="Team Leader" subtitle="Future team leaders will see only their assigned teams. Admins can preview any team during beta testing.">
      {user.role === 'admin' && (
        <div className="toolbar">
          <label>
            Preview team
            <select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <Kpi label="Weekly Points" value={pointTotal(week)} compact tone="good" />
          <Kpi label="Monthly Points" value={pointTotal(month)} compact tone="good" />
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Rep</th>
              <th>Points</th>
              <th>Budget</th>
              <th>Progress</th>
              <th>Sales</th>
              <th>Cancellations</th>
              <th>QC Open</th>
              <th>Weekly points</th>
              <th>Monthly points</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, index) => (
              <tr key={row.id}>
                <td>#{index + 1}</td>
                <td>{shortRepName(row.name)}</td>
                <td>{row.points}</td>
                <td>{row.budget}</td>
                <td>{row.budgetProgress}%</td>
                <td>{row.confirmed}</td>
                <td>{row.cancellations}</td>
                <td>{row.qcOpen}</td>
                <td>{pointTotal(week.filter((order) => order.repId === row.id))}</td>
                <td>{pointTotal(month.filter((order) => order.repId === row.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}

function AdminSales({ user }: { user: User }) {
  const [filters, setFilters] = useState<Filters>({ ...initialFilters, search: '' });
  const allowedReps = repsForUser(user);
  const [previewRepId, setPreviewRepId] = useState(allowedReps[0]?.id ?? reps[0].id);
  const activeRepId = user.role === 'sales_rep' && user.repId ? user.repId : allowedReps.some((rep) => rep.id === previewRepId) ? previewRepId : allowedReps[0]?.id ?? previewRepId;
  const activeRep = reps.find((rep) => rep.id === activeRepId) ?? allowedReps[0] ?? reps[0];
  const filtered = applyFilters(visibleOrdersForUser(orders, user), filters);
  const repFiltered = filtered.filter((order) => order.repId === activeRepId);
  const repRanking = rankReps(ordersInPeriod(orders, 'month'), repsForUser(user));
  const rank = repRanking.findIndex((row) => row.id === activeRepId) + 1;
  const points = pointTotal(repFiltered);
  return (
    <PageSection title="All Sales" subtitle="Sales reps see their own orders. Team leaders and admins can review allowed reps, period performance, and the full sales table in one place.">
      <div className="toolbar sales-summary">
        {user.role !== 'sales_rep' && (
          <label>
            Preview rep
            <select value={activeRepId} onChange={(event) => setPreviewRepId(event.target.value)}>
              {allowedReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {shortRepName(rep.name)}
                </option>
              ))}
            </select>
          </label>
        )}
        <Kpi label="Selected Period Points" value={points} compact tone="good" />
        <Kpi label="Point Budget" value={activeRep.monthlyPointBudget} compact />
        <Kpi label="Monthly Rank" value={`#${rank || '-'}`} compact />
      </div>
      <FiltersBar filters={filters} setFilters={setFilters} includeSearch user={user} showTeamFilter={user.role !== 'sales_rep'} showRepFilter={user.role !== 'sales_rep'} includePeriodPicker />
      <Card title={`${shortRepName(activeRep.name)} Period Progress`}>
        <ProgressRow label="Amera Points" value={points} max={activeRep.monthlyPointBudget} detail={`${points}/${activeRep.monthlyPointBudget} points`} />
      </Card>
      <div className="toolbar right">
        <button className="secondary" type="button" title="Placeholder for CSV/XLSX export">
          Export placeholder
        </button>
      </div>
      <OrdersTable orders={filtered} showRep />
    </PageSection>
  );
}

function Leaderboard({ user }: { user: User }) {
  const [period, setPeriod] = useState<CarouselPeriod>('yesterday');
  const scopedTeams = teamsForUser(user);
  const scopedReps = repsForUser(user);
  const scopedTeamIds = scopedTeams.map((team) => team.id);
  const visible = ordersInPeriod(orders, period).filter((order) => user.role === 'admin' || scopedTeamIds.includes(order.teamId));
  const fullRepRanking = rankReps(visible, scopedReps);
  const periodLabel = periodLabels[period];
  useCarouselPeriod(period, setPeriod);

  return (
    <PageSection title="Hall of Fame" subtitle={`Carousel view: ${periodLabel}`}>
      <CarouselTabs period={period} setPeriod={setPeriod} />
      <HallIndividualList title={user.role === 'admin' ? 'All Teams' : scopedTeams.map((team) => team.name).join(', ')} rows={fullRepRanking.slice(0, 12)} currentRepId={user.repId} />
    </PageSection>
  );
}

function AllTimeHighRecords({ user }: { user: User }) {
  const [period, setPeriod] = useState<CarouselPeriod>('yesterday');
  const scopedTeams = teamsForUser(user);
  const scopedReps = repsForUser(user);
  const scopedTeamIds = scopedTeams.map((team) => team.id);
  const scopedOrders = user.role === 'admin' ? orders : orders.filter((order) => scopedTeamIds.includes(order.teamId));
  const records = allTimeHighs(scopedOrders, scopedReps, scopedTeams);
  const record = records.find((item) => item.period === period);
  useCarouselPeriod(period, setPeriod);

  return (
    <PageSection title="All-Time High Records" subtitle={`Carousel view: ${periodLabels[period]}`}>
      <CarouselTabs period={period} setPeriod={setPeriod} />
      <section className="records-carousel">
        <div className="record-hero">
          <span>{periodLabels[period]}</span>
          <h3>Individual Record</h3>
          <div className="record-person">
            <Avatar name={record?.topRep?.name ?? 'No rep'} index={0} />
            <div>
              <strong>{record?.topRep ? shortRepName(record.topRep.name) : '-'}</strong>
              <small>{record?.topRep?.points ?? 0} Amera Points</small>
            </div>
          </div>
        </div>
        {user.role === 'admin' && (
          <div className="record-hero team-record">
            <span>{periodLabels[period]}</span>
            <h3>Team Record</h3>
            <div>
              <strong>{record?.topTeam?.name ?? '-'}</strong>
              <small>{record?.topTeam?.points ?? 0} Amera Points</small>
            </div>
          </div>
        )}
      </section>
    </PageSection>
  );
}

function useCarouselPeriod(period: CarouselPeriod, setPeriod: (period: CarouselPeriod) => void) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      const index = carouselPeriods.indexOf(period);
      setPeriod(carouselPeriods[(index + 1) % carouselPeriods.length]);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [period, setPeriod]);
}

function CarouselTabs({ period, setPeriod }: { period: CarouselPeriod; setPeriod: (period: CarouselPeriod) => void }) {
  return (
    <div className="period-tabs carousel-tabs">
      {carouselPeriods.map((item) => (
        <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>
          {periodLabels[item]}
        </button>
      ))}
    </div>
  );
}

function HallIndividualList({
  title,
  rows,
  currentRepId,
}: {
  title: string;
  rows: ReturnType<typeof rankReps>;
  currentRepId?: string;
}) {
  return (
    <section className="hall-card hall-list">
      <h3>{title}</h3>
      <ol>
        {rows.map((row, index) => (
          <li key={row.id} className={row.id === currentRepId ? 'current-rank' : ''}>
            <strong>{ordinal(index + 1)}</strong>
            <Avatar name={row.name} index={index} />
            <span>{shortRepName(row.name)}</span>
            <b>{row.points}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Avatar({ name, index }: { name: string; index: number }) {
  const palette = ['#5a9dce', '#955fc6', '#55ac87', '#c98558'];
  return (
    <i className="avatar" style={{ background: palette[index % palette.length] }}>
      {initials(name)}
    </i>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ordinal(value: number) {
  if (value === 1) return '1st';
  if (value === 2) return '2nd';
  if (value === 3) return '3rd';
  return `${value}th`;
}

function Overview() {
  const modules = [
    ['Employee management', 'Active reps, roles, join dates, and all-time high ownership.'],
    ['Team assignment', 'Reps grouped into teams for reporting and leader views.'],
    ['Control panel', 'Monthly point budgets, progress, sales, and predicted month-end pace.'],
    ['Reports', 'Seven-day team reporting with daily sales and absence tracking.'],
    ['Monthly report', 'Employee calendar view with sales by team per day.'],
    ['Hall of Fame', 'Day, week, month, year, and all-time rankings.'],
    ['Competitions', 'Date-bounded individual or team ranking contests.'],
    ['Slideshow', 'Large-screen leaderboard rotation with settings.'],
  ];
  return (
    <PageSection title="Current App Overview" subtitle="This page explains the old PHP app concepts that were reused for the beta, without carrying over the old implementation.">
      <div className="overview-grid">
        {modules.map(([title, body]) => (
          <Card key={title} title={title}>
            <p>{body}</p>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}

function FiltersBar({
  filters,
  setFilters,
  includeSearch,
  user,
  showTeamFilter = true,
  showRepFilter = true,
  includePeriodPicker = false,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  includeSearch: boolean;
  user: User;
  showTeamFilter?: boolean;
  showRepFilter?: boolean;
  includePeriodPicker?: boolean;
}) {
  const update = (key: keyof Filters, value: string) => setFilters({ ...filters, [key]: value });
  const availableTeams = teamsForUser(user);
  const availableReps = repsForUser(user);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('custom');
  const showCustomDates = !includePeriodPicker || periodMode === 'custom';
  return (
    <div className="filters">
      {includePeriodPicker && <PeriodPicker filters={filters} mode={periodMode} setFilters={setFilters} setMode={setPeriodMode} />}
      {showCustomDates && (
        <>
          <label>
            From
            <input type="date" value={filters.startDate} onChange={(event) => update('startDate', event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={filters.endDate} onChange={(event) => update('endDate', event.target.value)} />
          </label>
        </>
      )}
      {showTeamFilter && (
        <label>
          Team
          <select value={filters.teamId} onChange={(event) => update('teamId', event.target.value)}>
            <option value="all">All allowed teams</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {showRepFilter && (
        <label>
          Rep
          <select value={filters.repId} onChange={(event) => update('repId', event.target.value)}>
            <option value="all">All allowed reps</option>
            {availableReps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {shortRepName(rep.name)}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Status
        <select value={filters.status} onChange={(event) => update('status', event.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sale type
        <select value={filters.saleType} onChange={(event) => update('saleType', event.target.value)}>
          <option value="all">All sale types</option>
          {saleTypes.map((saleType) => (
            <option key={saleType} value={saleType}>
              {saleType}
            </option>
          ))}
        </select>
      </label>
      <label>
        Marketing
        <select value={filters.marketing} onChange={(event) => update('marketing', event.target.value)}>
          <option value="all">All marketing</option>
          {marketingTypes.map((marketing) => (
            <option key={marketing} value={marketing}>
              {marketing}
            </option>
          ))}
        </select>
      </label>
      {includeSearch && (
        <label>
          Search
          <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Order, sale type, product, comment" />
        </label>
      )}
    </div>
  );
}

function PeriodPicker({
  filters,
  mode,
  setFilters,
  setMode,
}: {
  filters: Filters;
  mode: PeriodMode;
  setFilters: (filters: Filters) => void;
  setMode: (mode: PeriodMode) => void;
}) {
  const [year, setYear] = useState('2026');
  const [week, setWeek] = useState('25');
  const [month, setMonth] = useState('06');

  function updateMode(nextMode: PeriodMode) {
    setMode(nextMode);
    applyPeriod(nextMode, year, week, month);
  }

  function applyPeriod(nextMode: PeriodMode, nextYear: string, nextWeek: string, nextMonth: string) {
    const bounds = periodBoundsFromPicker(nextMode, nextYear, nextWeek, nextMonth);
    if (bounds) {
      setFilters({ ...filters, startDate: bounds.startDate, endDate: bounds.endDate });
    }
  }

  function updateYear(nextYear: string) {
    setYear(nextYear);
    applyPeriod(mode, nextYear, week, month);
  }

  function updateWeek(nextWeek: string) {
    setWeek(nextWeek);
    applyPeriod(mode, year, nextWeek, month);
  }

  function updateMonth(nextMonth: string) {
    setMonth(nextMonth);
    applyPeriod(mode, year, week, nextMonth);
  }

  return (
    <>
      <label>
        View
        <select value={mode} onChange={(event) => updateMode(event.target.value as PeriodMode)}>
          <option value="custom">Custom dates</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </label>
      {mode !== 'custom' && (
        <label>
          Year
          <select value={year} onChange={(event) => updateYear(event.target.value)}>
            {['2026', '2025'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode === 'week' && (
        <label>
          Week
          <select value={week} onChange={(event) => updateWeek(event.target.value)}>
            {['25', '24', '23', '22'].map((item) => (
              <option key={item} value={item}>
                Week {item}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode === 'month' && (
        <label>
          Month
          <select value={month} onChange={(event) => updateMonth(event.target.value)}>
            {[
              ['06', 'June'],
              ['05', 'May'],
              ['04', 'April'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

function periodBoundsFromPicker(mode: PeriodMode, year: string, week: string, month: string): { startDate: string; endDate: string } | null {
  if (mode === 'week') {
    const weekRanges: Record<string, Record<string, { startDate: string; endDate: string }>> = {
      '2026': {
        '25': { startDate: '2026-06-15', endDate: '2026-06-21' },
        '24': { startDate: '2026-06-08', endDate: '2026-06-14' },
        '23': { startDate: '2026-06-01', endDate: '2026-06-07' },
        '22': { startDate: '2026-05-25', endDate: '2026-05-31' },
      },
      '2025': {
        '25': { startDate: '2025-06-16', endDate: '2025-06-22' },
        '24': { startDate: '2025-06-09', endDate: '2025-06-15' },
        '23': { startDate: '2025-06-02', endDate: '2025-06-08' },
        '22': { startDate: '2025-05-26', endDate: '2025-06-01' },
      },
    };
    return weekRanges[year]?.[week] ?? null;
  }
  if (mode === 'month') {
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    return { startDate: `${year}-${month}-01`, endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
  }
  if (mode === 'year') {
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  }
  return null;
}

function OrdersTable({ orders: tableOrders, showRep = false }: { orders: SaleOrder[]; showRep?: boolean }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            {showRep && <th>Sales Rep</th>}
            <th>PK/GK</th>
            <th>Sale type</th>
            <th>BK/NK</th>
            <th>Marketing</th>
            <th>Fiber Neu</th>
            <th>Points</th>
            <th>Status</th>
            <th>Product</th>
            <th>Übergangsproduct</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {tableOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.date}</td>
              {showRep && <td>{shortRepName(repName(reps, order.repId))}</td>}
              <td>{order.pkGk}</td>
              <td>{order.saleType}</td>
              <td>{order.bkNk}</td>
              <td>{order.marketing}</td>
              <td>{order.fiberNeu ? 'Yes' : 'No'}</td>
              <td>
                <strong>{order.points}</strong>
              </td>
              <td>
                <Badge status={order.status} />
              </td>
              <td>{order.product}</td>
              <td>{order.transitionProduct}</td>
              <td>{order.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({ label, value, tone, compact = false }: { label: string; value: string | number; tone?: string; compact?: boolean }) {
  return (
    <div className={`kpi ${tone ?? ''} ${compact ? 'compact' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PageSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ProgressRow({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="progress-row">
      <div>
        <strong>{label}</strong>
        <span>{detail ?? `${value}`}</span>
      </div>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return <span className={`badge ${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

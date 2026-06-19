import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { orders, projectsList, reps, statuses, teams, users } from './data/mockData';
import { Filters, SaleOrder, User } from './types';
import {
  applyFilters,
  confirmedCount,
  getMetrics,
  initialFilters,
  ordersInPeriod,
  rankReps,
  rankTeams,
  repName,
  teamName,
  visibleOrdersForUser,
} from './utils/metrics';
import './styles.css';

type Page = 'dashboard' | 'my-sales' | 'team-leader' | 'admin-sales' | 'leaderboard' | 'overview';

const navItems: { page: Page; label: string }[] = [
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'my-sales', label: 'My Sales' },
  { page: 'team-leader', label: 'Team Leader' },
  { page: 'admin-sales', label: 'All Sales' },
  { page: 'leaderboard', label: 'Hall of Fame' },
  { page: 'overview', label: 'Current App Overview' },
];

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Amera</strong>
            <span>Salesboard beta</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.page} className={page === item.page ? 'active' : ''} onClick={() => setPage(item.page)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="role-card">
          <span>Signed in as</span>
          <strong>{user.name}</strong>
          <small>{user.role.replace('_', ' ')}</small>
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main>
        <Header user={user} />
        {page === 'dashboard' && <Dashboard user={user} />}
        {page === 'my-sales' && <MySales user={user} />}
        {page === 'team-leader' && <TeamLeader user={user} />}
        {page === 'admin-sales' && <AdminSales user={user} />}
        {page === 'leaderboard' && <Leaderboard user={user} />}
        {page === 'overview' && <Overview />}
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
        <div className="brand login-brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Amera Salesboard</strong>
            <span>Beta reporting demo</span>
          </div>
        </div>
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

function Header({ user }: { user: User }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Static GitHub Pages beta</p>
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
  const rankedTeams = rankTeams(filtered, teams).slice(0, 4);

  return (
    <PageSection title="Main Dashboard" subtitle="All beta users are admins, so this view currently includes every dummy team and sales rep.">
      <FiltersBar filters={filters} setFilters={setFilters} includeSearch={false} />
      <div className="kpi-grid">
        <Kpi label="Total Sales" value={metrics.total} />
        <Kpi label="Confirmed Sales" value={metrics.confirmed} tone="good" />
        <Kpi label="Cancelled" value={metrics.cancelled} tone="bad" />
        <Kpi label="QC Open" value={metrics.qcOpen} tone="warn" />
        <Kpi label="Net Sales" value={metrics.net} />
        <Kpi label="Take Rate" value={`${metrics.takeRate}%`} />
      </div>
      <div className="split">
        <Card title="Team Progress">
          {rankedTeams.map((team) => (
            <ProgressRow key={team.id} label={team.name} value={team.confirmed} max={team.goal} detail={`${team.confirmed}/${team.goal} confirmed`} />
          ))}
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

function MySales({ user }: { user: User }) {
  const [repId, setRepId] = useState(reps[0].id);
  const scoped = user.role === 'sales_rep' && user.repId ? orders.filter((order) => order.repId === user.repId) : orders.filter((order) => order.repId === repId);
  return (
    <PageSection title="My Sales" subtitle="Future sales reps will only see their own rows. Admins can preview any rep during beta testing.">
      {user.role === 'admin' && (
        <div className="toolbar">
          <label>
            Preview rep
            <select value={repId} onChange={(event) => setRepId(event.target.value)}>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <OrdersTable orders={scoped} />
    </PageSection>
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
          <Kpi label="Weekly Confirmed" value={confirmedCount(week)} compact />
          <Kpi label="Monthly Confirmed" value={confirmedCount(month)} compact />
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Rep</th>
              <th>Sales</th>
              <th>Cancellations</th>
              <th>QC Open</th>
              <th>Weekly total</th>
              <th>Monthly total</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, index) => (
              <tr key={row.id}>
                <td>#{index + 1}</td>
                <td>{row.name}</td>
                <td>{row.confirmed}</td>
                <td>{row.cancellations}</td>
                <td>{row.qcOpen}</td>
                <td>{confirmedCount(week.filter((order) => order.repId === row.id))}</td>
                <td>{confirmedCount(month.filter((order) => order.repId === row.id))}</td>
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
  const filtered = applyFilters(visibleOrdersForUser(orders, user), filters);
  return (
    <PageSection title="Admin / All Sales" subtitle="Axel, Aleksander and Luis can see every dummy order in the beta.">
      <FiltersBar filters={filters} setFilters={setFilters} includeSearch />
      <div className="toolbar right">
        <button className="secondary" type="button" title="Placeholder for CSV/XLSX export">
          Export placeholder
        </button>
      </div>
      <OrdersTable orders={filtered} showRep showTeam />
    </PageSection>
  );
}

function Leaderboard({ user }: { user: User }) {
  const [period, setPeriod] = useState('week');
  const visible = ordersInPeriod(visibleOrdersForUser(orders, user), period);
  const repRanking = rankReps(visible, reps).slice(0, 10);
  const teamRanking = rankTeams(visible, teams);
  return (
    <PageSection title="Leaderboard / Hall of Fame" subtitle="Recreates the old day, week, month, year and all-time ranking concept for teams and individuals.">
      <div className="period-tabs">
        {['day', 'week', 'month', 'year', 'all'].map((item) => (
          <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>
            {item === 'all' ? 'All time' : item}
          </button>
        ))}
      </div>
      <div className="split">
        <RankingCard title="Individuals" rows={repRanking.map((row) => ({ label: row.name, value: row.confirmed, meta: teamName(teams, row.teamId) }))} />
        <RankingCard title="Teams" rows={teamRanking.map((row) => ({ label: row.name, value: row.confirmed, meta: `${row.qcOpen} QC open` }))} />
      </div>
    </PageSection>
  );
}

function Overview() {
  const modules = [
    ['Employee management', 'Active reps, roles, join dates, and all-time high ownership.'],
    ['Team assignment', 'Reps grouped into teams for reporting and leader views.'],
    ['Control panel', 'Monthly goals, progress, sales, and predicted month-end pace.'],
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

function FiltersBar({ filters, setFilters, includeSearch }: { filters: Filters; setFilters: (filters: Filters) => void; includeSearch: boolean }) {
  const update = (key: keyof Filters, value: string) => setFilters({ ...filters, [key]: value });
  return (
    <div className="filters">
      <label>
        From
        <input type="date" value={filters.startDate} onChange={(event) => update('startDate', event.target.value)} />
      </label>
      <label>
        To
        <input type="date" value={filters.endDate} onChange={(event) => update('endDate', event.target.value)} />
      </label>
      <label>
        Team
        <select value={filters.teamId} onChange={(event) => update('teamId', event.target.value)}>
          <option value="all">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rep
        <select value={filters.repId} onChange={(event) => update('repId', event.target.value)}>
          <option value="all">All reps</option>
          {reps.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
      </label>
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
        Project
        <select value={filters.project} onChange={(event) => update('project', event.target.value)}>
          <option value="all">All projects</option>
          {projectsList.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </label>
      {includeSearch && (
        <label>
          Search
          <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Order, address, comment" />
        </label>
      )}
    </div>
  );
}

function OrdersTable({ orders: tableOrders, showRep = false, showTeam = false }: { orders: SaleOrder[]; showRep?: boolean; showTeam?: boolean }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            {showRep && <th>Rep</th>}
            {showTeam && <th>Team</th>}
            <th>Customer / address</th>
            <th>Project</th>
            <th>Status</th>
            <th>Product</th>
            <th>Comment</th>
            <th>Claimable</th>
          </tr>
        </thead>
        <tbody>
          {tableOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.date}</td>
              {showRep && <td>{repName(reps, order.repId)}</td>}
              {showTeam && <td>{teamName(teams, order.teamId)}</td>}
              <td>
                <strong>{order.customerLabel}</strong>
                <span>{order.address}</span>
              </td>
              <td>{order.project}</td>
              <td>
                <Badge status={order.status} />
              </td>
              <td>{order.product}</td>
              <td>{order.comment}</td>
              <td>{order.claimable ? 'Yes' : 'No'}</td>
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

function RankingCard({ title, rows }: { title: string; rows: { label: string; value: number; meta: string }[] }) {
  return (
    <Card title={title}>
      <ol className="ranking">
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <small>{row.meta}</small>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ol>
    </Card>
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

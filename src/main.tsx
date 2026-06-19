import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { orders, pointRules, reps, saleTypes, statuses, teams, users } from './data/mockData';
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
    <PageSection title="Main Dashboard" subtitle="All beta users are admins. Performance is now measured by sales volume and Amera Points.">
      <FiltersBar filters={filters} setFilters={setFilters} includeSearch={false} />
      <div className="kpi-grid">
        <Kpi label="Amera Points" value={metrics.points} tone="good" />
        <Kpi label="Total Sales" value={metrics.totalSales} />
        <Kpi label="Avg Points / Sale" value={metrics.averagePoints} />
        <Kpi label="In Progress" value={metrics.inProgress} />
        <Kpi label="Cancelled" value={metrics.cancelled} tone="bad" />
        <Kpi label="QC Open" value={metrics.qcOpen} tone="warn" />
      </div>
      <div className="split">
        <Card title="Team Point Progress">
          {rankedTeams.map((team) => (
            <ProgressRow key={team.id} label={team.name} value={team.points} max={team.goal} detail={`${team.points}/${team.goal} points`} />
          ))}
        </Card>
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

function MySales({ user }: { user: User }) {
  const [repId, setRepId] = useState(reps[0].id);
  const activeRepId = user.role === 'sales_rep' && user.repId ? user.repId : repId;
  const activeRep = reps.find((rep) => rep.id === activeRepId) ?? reps[0];
  const scoped = orders.filter((order) => order.repId === activeRepId);
  const repRanking = rankReps(ordersInPeriod(orders, 'month'), reps);
  const rank = repRanking.findIndex((row) => row.id === activeRepId) + 1;
  const points = pointTotal(scoped.filter((order) => order.date >= '2026-06-01'));
  return (
    <PageSection title="My Sales" subtitle="Future sales reps will only see their own sales, point budget, and comparison against other reps. Admins can preview any rep during beta testing.">
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
          <Kpi label="Monthly Points" value={points} compact tone="good" />
          <Kpi label="Point Budget" value={activeRep.monthlyPointBudget} compact />
          <Kpi label="Rep Rank" value={`#${rank || '-'}`} compact />
        </div>
      )}
      <Card title={`${activeRep.name} Budget Progress`}>
        <ProgressRow label="Monthly Amera Points" value={points} max={activeRep.monthlyPointBudget} detail={`${points}/${activeRep.monthlyPointBudget} points`} />
      </Card>
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
                <td>{row.name}</td>
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
  const filtered = applyFilters(visibleOrdersForUser(orders, user), filters);
  return (
    <PageSection title="Admin / All Sales" subtitle="Axel, Aleksander and Luis can see every dummy order, point value, sale type, status, and sales rep in the beta.">
      <FiltersBar filters={filters} setFilters={setFilters} includeSearch />
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
  const [period, setPeriod] = useState('week');
  const visible = ordersInPeriod(visibleOrdersForUser(orders, user), period);
  const repRanking = rankReps(visible, reps).slice(0, 10);
  const teamRanking = rankTeams(visible, teams);
  const records = allTimeHighs(visibleOrdersForUser(orders, user), reps, teams);
  return (
    <PageSection title="Leaderboard / Hall of Fame" subtitle="Competitions and leaderboard positions are measured by Amera Points. Public rep names show first name and last initial only.">
      <div className="period-tabs">
        {['yesterday', 'current', 'week', 'month', 'year', 'all'].map((item) => (
          <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>
            {item === 'all' ? 'All time' : item}
          </button>
        ))}
      </div>
      <div className="split">
        <RankingCard title="Individuals" rows={repRanking.map((row) => ({ label: shortRepName(row.name), value: row.points, meta: `${teamName(teams, row.teamId)} · ${row.confirmed} sales` }))} />
        <RankingCard title="Teams" rows={teamRanking.map((row) => ({ label: row.name, value: row.points, meta: `${row.confirmed} sales · ${row.qcOpen} QC open` }))} />
      </div>
      <Card title="All-Time High Records">
        <div className="records-grid">
          {records.map((record) => (
            <div key={record.period} className="record-tile">
              <span>{record.label}</span>
              <strong>{record.topRep ? shortRepName(record.topRep.name) : '-'}</strong>
              <small>{record.topRep?.points ?? 0} individual points</small>
              <strong>{record.topTeam?.name ?? '-'}</strong>
              <small>{record.topTeam?.points ?? 0} team points</small>
            </div>
          ))}
        </div>
      </Card>
    </PageSection>
  );
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
      {includeSearch && (
        <label>
          Search
          <input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Order, sale type, product, comment" />
        </label>
      )}
    </div>
  );
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
              {showRep && <td>{repName(reps, order.repId)}</td>}
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

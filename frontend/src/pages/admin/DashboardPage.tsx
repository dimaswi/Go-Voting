import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/lib/api'
import type { DashboardStats } from '@/types'
import {
  Users, Calendar, TrendingUp, TrendingDown,
  CheckSquare
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { cn } from '@/lib/utils'

// Simulated data for the area chart (since the backend doesn't provide historical data yet)
const overviewData = [
  { name: 'Jan', voters: 180 },
  { name: 'Feb', voters: 240 },
  { name: 'Mar', voters: 200 },
  { name: 'Apr', voters: 310 },
  { name: 'May', voters: 340 },
  { name: 'Jun', voters: 290 },
  { name: 'Jul', voters: 380 },
  { name: 'Aug', voters: 420 },
  { name: 'Sep', voters: 410 },
  { name: 'Oct', voters: 390 },
  { name: 'Nov', voters: 460 },
  { name: 'Dec', voters: 520 },
]

export default function DashboardPage() {
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
    refetchInterval: 30000,
  })

  const stats: DashboardStats = statsData?.data?.data || {
    total_events: 0, active_events: 0,
    total_candidates: 0, total_voters: 0,
    total_voted: 0, total_not_voted: 0,
  }

  // Use real data from backend for the pie chart
  const actualTrafficData = [
    { name: 'Sudah Vote', value: stats.total_voted || 0, color: '#16a34a' },
    { name: 'Belum Vote', value: stats.total_not_voted || 0, color: '#f59e0b' },
  ]

  return (
    <div className="animate-fade-in space-y-6 max-w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Pantau statistik dan aktivitas sistem voting Anda.</p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Voters</p>
              <h3 className="text-3xl font-bold">{stats.total_voters.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 z-10 mt-2">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +12.5% <span className="text-muted-foreground ml-1.5 font-normal">bulan ini</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Events</p>
              <h3 className="text-3xl font-bold">{stats.total_events.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 z-10 mt-2">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +8.2% <span className="text-muted-foreground ml-1.5 font-normal">bulan ini</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Kandidat</p>
              <h3 className="text-3xl font-bold">{stats.total_candidates.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-red-500 z-10 mt-2">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            -3.1% <span className="text-muted-foreground ml-1.5 font-normal">bulan ini</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[130px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Sudah Vote</p>
              <h3 className="text-3xl font-bold">{stats.total_voted.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 z-10 mt-2">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +24.7% <span className="text-muted-foreground ml-1.5 font-normal">bulan ini</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-sm font-semibold mb-6">Pertumbuhan Partisipasi Voting</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVoters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} Partisipan`, '']}
                />
                <Area type="monotone" dataKey="voters" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorVoters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-1 bg-card rounded-xl border shadow-sm p-6 flex flex-col">
          <h2 className="text-sm font-semibold mb-2">Rasio Partisipasi</h2>
          <p className="text-xs text-muted-foreground mb-6">Perbandingan voter yang sudah dan belum vote secara global.</p>

          <div className="flex-1 min-h-[250px] relative flex flex-col items-center justify-center">
            {(stats.total_voters > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actualTrafficData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {actualTrafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Voters`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">Belum ada data partisipasi</p>
              </div>
            )}

            {/* Center text overlay */}
            {stats.total_voters > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                <span className="text-2xl font-bold text-foreground">
                  {stats.total_voters > 0 ? Math.round((stats.total_voted / stats.total_voters) * 100) : 0}%
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Voted</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

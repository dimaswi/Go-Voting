import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '@/lib/api'
import type { EventResultResponse } from '@/types'
import { ArrowLeft, Trophy, Users, CheckCircle, PieChart as PieChartIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area } from 'recharts'

const sparklineData1 = [{ v: 10 }, { v: 12 }, { v: 11 }, { v: 15 }, { v: 14 }, { v: 18 }, { v: 20 }]
const sparklineData2 = [{ v: 5 }, { v: 8 }, { v: 6 }, { v: 10 }, { v: 12 }, { v: 15 }, { v: 18 }]
const sparklineData3 = [{ v: 20 }, { v: 18 }, { v: 15 }, { v: 17 }, { v: 14 }, { v: 12 }, { v: 10 }]
const sparklineData4 = [{ v: 100 }, { v: 120 }, { v: 110 }, { v: 150 }, { v: 140 }, { v: 180 }, { v: 200 }]
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['event-results', id],
    queryFn: () => eventsAPI.getResults(id!),
    enabled: !!id,
    refetchInterval: 10000, // Live refresh every 10s
  })

  const results: EventResultResponse | undefined = data?.data?.data

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  )

  if (!results) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Data hasil tidak ditemukan</p>
    </div>
  )

  const chartData = results.candidates.map(c => ({
    name: c.full_name.split(' ').slice(0, 2).join(' '),
    votes: c.vote_count,
    percentage: c.percentage.toFixed(1),
  }))

  const winner = results.candidates[0]

  const actualTrafficData = [
    { name: 'Sudah Vote', value: results.total_voted, color: '#16a34a' },
    { name: 'Belum Vote', value: results.total_not_voted, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`/admin/events/${id}`)} className="bg-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hasil Voting</h1>
            <p className="text-sm text-muted-foreground mt-1">{results.event.name}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Voter */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Voter</p>
              <h3 className="text-3xl font-bold">{results.total_voters.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 z-10 mt-2">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Terdata <span className="text-muted-foreground ml-1.5 font-normal">di sistem</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[60px] opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData1}>
                <defs>
                  <linearGradient id="resGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} fill="url(#resGrad1)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Sudah Vote */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Sudah Vote</p>
              <h3 className="text-3xl font-bold">{results.total_voted.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 z-10 mt-2">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Aktif <span className="text-muted-foreground ml-1.5 font-normal">memberikan suara</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[60px] opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData2}>
                <defs>
                  <linearGradient id="resGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2} fill="url(#resGrad2)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Belum Vote */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Belum Vote</p>
              <h3 className="text-3xl font-bold">{results.total_not_voted.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-red-500 z-10 mt-2">
            <TrendingDown className="w-3.5 h-3.5 mr-1" />
            Pasif <span className="text-muted-foreground ml-1.5 font-normal">belum ada suara</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[60px] opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData3}>
                <defs>
                  <linearGradient id="resGrad3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#d97706" strokeWidth={2} fill="url(#resGrad3)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Partisipasi */}
        <div className="bg-card rounded-xl border shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Partisipasi</p>
              <h3 className="text-3xl font-bold">{results.participation_pct.toFixed(1)}%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-green-600 z-10 mt-2">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Engagement <span className="text-muted-foreground ml-1.5 font-normal">saat ini</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[60px] opacity-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData4}>
                <defs>
                  <linearGradient id="resGrad4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#9333ea" strokeWidth={2} fill="url(#resGrad4)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-6">Perolehan Suara</h2>
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={48} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`${value} Suara`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Belum ada suara masuk
              </div>
            )}
          </div>

          {/* Ranking Table */}
          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-sm font-semibold">Peringkat Kandidat</h2>
            </div>
            <div className="divide-y divide-border">
              {results.candidates.map((c, idx) => (
                <div key={c.candidate_id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                    idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-muted text-muted-foreground'
                    }`}>
                    {idx + 1}
                  </div>
                  {c.photo_url && (
                    <img src={c.photo_url} alt={c.full_name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Kandidat No. {c.candidate_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{c.vote_count} suara</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2 overflow-hidden hidden sm:block">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Highlight */}
        <div className="lg:col-span-1 space-y-6">
          {/* Winner Card */}
          {winner && results.total_voted > 0 ? (
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-[-20px] top-[-20px] opacity-20">
                <Trophy className="w-40 h-40" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-sm uppercase tracking-wider text-yellow-50">Posisi Unggul</span>
                </div>

                {winner.photo_url ? (
                  <img src={winner.photo_url} alt={winner.full_name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-sm mb-4" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4 border-4 border-white/30 backdrop-blur-sm">
                    <Users className="w-8 h-8 text-white/70" />
                  </div>
                )}

                <h3 className="text-xl font-bold leading-tight mb-1">{winner.full_name}</h3>
                <div className="flex flex-col gap-1 mt-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 w-fit">Kandidat No. {winner.candidate_number}</Badge>
                  <p className="text-yellow-100 font-medium text-sm mt-1">{winner.vote_count} Suara ({winner.percentage.toFixed(1)}%)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center text-center h-[280px]">
              <Trophy className="w-12 h-12 text-muted mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada pemenang</p>
              <p className="text-xs text-muted-foreground mt-1">Voting belum dimulai atau suara belum masuk.</p>
            </div>
          )}

          {/* Donut Chart - Rasio Partisipasi */}
          <div className="bg-card rounded-xl border shadow-sm p-6 flex flex-col">
            <h2 className="text-sm font-semibold mb-2">Rasio Partisipasi</h2>
            <p className="text-xs text-muted-foreground mb-6">Perbandingan voter yang sudah dan belum vote.</p>

            <div className="flex-1 min-h-[250px] relative flex flex-col items-center justify-center">
              {(results.total_voters > 0) ? (
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
                      formatter={(value: any) => [`${value} Voters`, '']}
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
              {results.total_voters > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                  <span className="text-2xl font-bold text-foreground">
                    {results.total_voters > 0 ? Math.round((results.total_voted / results.total_voters) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Voted</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Data diperbarui otomatis setiap 10 detik • Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
      </p>
    </div>
  )
}

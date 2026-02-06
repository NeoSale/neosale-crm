'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCliente } from '@/contexts/ClienteContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import {
  Users,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  RefreshCw,
  Loader2,
  Lock,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

interface SalespersonStats {
  salespersonId: string
  salespersonName: string
  salespersonEmail: string
  totalLeadsReceived: number
  totalLeadsCompleted: number
  totalLeadsActive: number
  totalLeadsTransferred: number
  conversionRate: number
}

interface DistributionReport {
  period: { start: string; end: string }
  summary: {
    totalLeadsDistributed: number
    totalLeadsInQueue: number
    totalLeadsCompleted: number
    averageConversionRate: number
  }
  byStatus: Record<string, number>
  bySalesperson: SalespersonStats[]
  dailyTrend: Array<{ date: string; distributed: number; completed: number }>
}

const COLORS = {
  primary: '#403CCF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}

const STATUS_COLORS: Record<string, string> = {
  ativo: COLORS.info,
  concluido: COLORS.success,
  transferido: COLORS.warning,
  cancelado: COLORS.danger,
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 bg-[#403CCF]/10 rounded-lg">{icon}</div>
      </div>
    </div>
  )
}

export default function DistribuicaoPage() {
  useRequireAuth()
  const { selectedClienteId: clienteId } = useCliente()
  const { canViewReports } = usePermissions()

  const [report, setReport] = useState<DistributionReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  const fetchReport = useCallback(async () => {
    if (!clienteId) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      })

      const response = await fetch(
        `${apiUrl}/api/relatorios/distribuicao?${params.toString()}`,
        {
          headers: { cliente_id: clienteId },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setReport(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }, [clienteId, dateRange, apiUrl])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  if (!canViewReports) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to view distribution reports
          </p>
        </div>
      </div>
    )
  }

  if (loading && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#403CCF]" />
      </div>
    )
  }

  // Prepare chart data
  const dailyTrendData =
    report?.dailyTrend.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      }),
    })) || []

  const statusData = report
    ? Object.entries(report.byStatus).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: STATUS_COLORS[key] || COLORS.info,
      }))
    : []

  const salespersonData =
    report?.bySalesperson.slice(0, 10).map((sp) => ({
      name: sp.salespersonName.split(' ')[0],
      received: sp.totalLeadsReceived,
      completed: sp.totalLeadsCompleted,
      active: sp.totalLeadsActive,
    })) || []

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header with date filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Distribution Report
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Lead distribution overview and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-4 py-2 bg-[#403CCF] text-white rounded-lg hover:bg-[#403CCF]/90"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Distributed"
              value={report.summary.totalLeadsDistributed}
              subtitle="Leads assigned to salespeople"
              icon={<Users className="w-6 h-6 text-[#403CCF]" />}
            />
            <MetricCard
              title="In Queue"
              value={report.summary.totalLeadsInQueue}
              subtitle="Waiting for assignment"
              icon={<Clock className="w-6 h-6 text-[#403CCF]" />}
            />
            <MetricCard
              title="Completed"
              value={report.summary.totalLeadsCompleted}
              subtitle="Successfully closed"
              icon={<Target className="w-6 h-6 text-[#403CCF]" />}
            />
            <MetricCard
              title="Avg. Conversion"
              value={`${report.summary.averageConversionRate}%`}
              subtitle="Across all salespeople"
              icon={<TrendingUp className="w-6 h-6 text-[#403CCF]" />}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Trend
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={dailyTrendData}>
                    <defs>
                      <linearGradient
                        id="colorDistributed"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.primary}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.primary}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.success}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.success}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="distributed"
                      name="Distributed"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorDistributed)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stroke={COLORS.success}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                By Status
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leads by Salesperson
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={salespersonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="received"
                    name="Received"
                    fill={COLORS.info}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill={COLORS.success}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="active"
                    name="Active"
                    fill={COLORS.warning}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Salesperson Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Salesperson
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Received
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Active
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Completed
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Transferred
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Conversion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.bySalesperson.map((sp, index) => (
                    <tr
                      key={sp.salespersonId}
                      className={`border-b border-gray-100 dark:border-gray-700/50 ${
                        index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {sp.salespersonName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {sp.salespersonEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {sp.totalLeadsReceived}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {sp.totalLeadsActive}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {sp.totalLeadsCompleted}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                        {sp.totalLeadsTransferred}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            sp.conversionRate >= 50
                              ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                              : sp.conversionRate >= 25
                              ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
                              : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                          }`}
                        >
                          {sp.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import DataUpload from './DataUpload'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight 
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const Dashboard: React.FC = () => {
  const { clinicalData, metrics } = useData()
  const navigate = useNavigate()

  if (!clinicalData || !metrics) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to CT-Viz</h2>
          <p className="text-gray-600 mb-6">
            Upload a clinical trial dataset to begin visualizing your data.
          </p>
          <DataUpload />
        </div>
      </div>
    )
  }

  const statusData = Object.entries(metrics.statusBreakdown).map(([name, value]) => ({
    name,
    value
  }))

  const siteChartData = metrics.sitePerformance
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 10)
    .map(site => ({
      name: site.siteName,
      enrollment: site.enrollmentCount,
      completionRate: Math.round(site.completionRate)
    }))

  const genderData = clinicalData.patients.reduce((acc, patient) => {
    const gender = patient.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const genderChartData = Object.entries(genderData).map(([name, value]) => ({
    name,
    value
  }))

  // Age distribution
  const ageGroups = clinicalData.patients.reduce((acc, patient) => {
    const age = patient.age || 0
    let group = ''
    if (age < 18) group = '<18'
    else if (age < 30) group = '18-29'
    else if (age < 40) group = '30-39'
    else if (age < 50) group = '40-49'
    else if (age < 60) group = '50-59'
    else if (age < 70) group = '60-69'
    else group = '70+'
    
    acc[group] = (acc[group] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const ageChartData = Object.entries(ageGroups)
    .sort((a, b) => {
      const order = ['<18', '18-29', '30-39', '40-49', '50-59', '60-69', '70+']
      return order.indexOf(a[0]) - order.indexOf(b[0])
    })
    .map(([name, value]) => ({ name, value }))

  const insights = clinicalData.metadata?.insights

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <DataUpload />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Patients"
          value={metrics.totalPatients}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Total Sites"
          value={metrics.totalSites}
          icon={<Building2 className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Active Sites"
          value={metrics.activeSites}
          icon={<Building2 className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Enrollment Rate"
          value={`${metrics.enrollmentRate}/month`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="orange"
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="teal"
        />
      </div>

      {/* Adaptive Insights */}
      {insights && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Insights</h3>
          <p className="text-sm text-gray-600 mb-4">
            {insights.rowCount} rows • {insights.columnCount} columns
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {insights.highlights.slice(0, 5).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Patient Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {genderChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Age Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Sites by Enrollment">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={siteChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="enrollment" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Sites List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Sites</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.sitePerformance.map((site) => (
                <tr key={site.siteId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {site.siteId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {site.siteName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {site.enrollmentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(site.completionRate)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/site/${site.siteId}`)}
                      className="text-primary-600 hover:text-primary-800 flex items-center"
                    >
                      View Report
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default Dashboard


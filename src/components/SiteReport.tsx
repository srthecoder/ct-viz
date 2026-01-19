import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Activity } from 'lucide-react'
import { useData } from '../context/DataContext'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

const SiteReport: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>()
  const { clinicalData } = useData()

  if (!clinicalData || !siteId) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Clinic not found or no data available.</p>
        <Link to="/" className="text-primary-600 hover:text-primary-800 mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const sitePatients = clinicalData.patients.filter(p => p.siteId === siteId)
  const site = clinicalData.sites.find(s => s.siteId === siteId)

  if (!site || sitePatients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">No patients found for this clinic.</p>
        <Link to="/" className="text-primary-600 hover:text-primary-800 mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  // Calculate site-specific metrics
  const statusBreakdown = sitePatients.reduce((acc, patient) => {
    acc[patient.status] = (acc[patient.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusData = Object.entries(statusBreakdown).map(([name, value]) => ({
    name,
    value
  }))

  const completedCount = statusBreakdown['Completed'] || statusBreakdown['Complete'] || 0
  const completionRate = (completedCount / sitePatients.length) * 100

  // Gender distribution for this site
  const genderData = sitePatients.reduce((acc, patient) => {
    const gender = patient.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const genderChartData = Object.entries(genderData).map(([name, value]) => ({
    name,
    value
  }))

  // Age distribution
  const ageGroups = sitePatients.reduce((acc, patient) => {
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

  // Enrollment timeline
  const enrollmentByDate = sitePatients.reduce((acc, patient) => {
    const date = patient.enrollmentDate.split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const timelineData = Object.entries(enrollmentByDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      date: date.split('-').slice(1).join('/'), // MM/DD format
      enrollments: count
    }))

  // Treatment distribution
  const treatmentData = sitePatients.reduce((acc, patient) => {
    acc[patient.treatment] = (acc[patient.treatment] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const treatmentChartData = Object.entries(treatmentData).map(([name, value]) => ({
    name,
    value
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{site.siteName}</h2>
            <p className="text-sm text-gray-500">Clinic ID: {siteId}</p>
          </div>
        </div>
      </div>

      {/* Clinic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Patients"
          value={sitePatients.length}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Completion Rate"
          value={`${Math.round(completionRate)}%`}
          icon={<Activity className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Completed"
          value={completedCount}
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Active"
          value={sitePatients.length - completedCount}
          icon={<Users className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Patient Status">
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

        <ChartCard title="Treatment Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={treatmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Enrollment Timeline */}
      {timelineData.length > 0 && (
        <ChartCard title="Enrollment Timeline">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="enrollments" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patients</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sitePatients.map((patient) => (
                <tr key={patient.patientId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.enrollmentDate.split('T')[0]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      patient.status === 'Completed' || patient.status === 'Complete'
                        ? 'bg-green-100 text-green-800'
                        : patient.status === 'Active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.treatment}
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
    orange: 'bg-orange-100 text-orange-600'
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

export default SiteReport


import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import DataUpload from './DataUpload'
import AdaptiveChart from './AdaptiveChart'
import { 
  Database,
  TrendingUp,
  FileText,
  BarChart3
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { clinicalData, metrics, rawData } = useData()
  const navigate = useNavigate()

  if (!clinicalData || !metrics || !rawData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to CT-Viz</h2>
          <p className="text-gray-600 mb-6">
            Upload any dataset to begin visualizing your data. The dashboard will automatically adapt to show insights specific to your data.
          </p>
          <DataUpload />
        </div>
      </div>
    )
  }

  const insights = clinicalData.metadata?.insights

  // Generate dynamic metrics from insights
  const dynamicMetrics = insights?.columns
    .filter(col => col.type === 'numeric' && col.stats)
    .slice(0, 4)
    .map(col => ({
      title: col.name,
      value: col.stats?.mean?.toFixed(2) || 'N/A',
      subtitle: `Min: ${col.stats?.min} | Max: ${col.stats?.max}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'blue' as const
    })) || []

  // Add dataset-level metrics
  const datasetMetrics = [
    {
      title: 'Total Records',
      value: insights?.rowCount || rawData.length,
      subtitle: `${insights?.columnCount || 0} columns`,
      icon: <Database className="h-5 w-5" />,
      color: 'blue' as const
    },
    {
      title: 'Complete Records',
      value: insights?.columns.reduce((sum, col) => sum + col.count, 0) || 0,
      subtitle: 'Total data points',
      icon: <FileText className="h-5 w-5" />,
      color: 'green' as const
    }
  ]

  // Get columns suitable for visualization (exclude IDs and low-cardinality text)
  const visualizableColumns = insights?.columns.filter(col => {
    // Show categorical with reasonable cardinality
    if (col.type === 'categorical' && col.unique > 1 && col.unique <= 50) return true
    // Show numeric columns
    if (col.type === 'numeric' && col.unique > 5) return true
    // Show date columns
    if (col.type === 'date') return true
    return false
  }).slice(0, 8) || [] // Limit to 8 charts for performance

  // Optional: Show clinical-specific charts if relevant columns exist
  const hasClinicalStructure = rawData.some(row => 
    (row?.patientId || row?.patient_id || row?.id) && 
    (row?.siteId || row?.site_id || row?.site)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Adaptive Data Dashboard</h2>
        <DataUpload />
      </div>

      {/* Dataset Overview */}
      {insights && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {datasetMetrics.map((metric, idx) => (
              <MetricCard key={idx} {...metric} />
            ))}
            {dynamicMetrics.slice(0, 2).map((metric, idx) => (
              <MetricCard key={`dynamic-${idx}`} {...metric} />
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {insights && insights.highlights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
            Key Insights
          </h3>
          <ul className="space-y-2">
            {insights.highlights.slice(0, 6).map((highlight, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Adaptive Visualizations */}
      {visualizableColumns.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Data Visualizations</h3>
            <p className="text-sm text-gray-500">
              {visualizableColumns.length} charts generated from your data
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visualizableColumns.map((column) => (
              <AdaptiveChart
                key={column.name}
                profile={column}
                rawData={rawData}
              />
            ))}
          </div>
        </>
      )}

      {/* Clinical-specific section (only if structure matches) */}
      {hasClinicalStructure && clinicalData.sites.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Performance</h3>
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
                        className="text-primary-600 hover:text-primary-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 uppercase">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

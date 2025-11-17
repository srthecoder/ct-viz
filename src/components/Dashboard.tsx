import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import DataUpload from './DataUpload'
import AdaptiveChart from './AdaptiveChart'
import { 
  Database,
  TrendingUp,
  FileText,
  BarChart3,
  Filter,
  Download,
  X
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { clinicalData, metrics, rawData } = useData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<{
    site: string
    gender: string
    treatment: string
  }>({
    site: 'all',
    gender: 'all',
    treatment: 'all'
  })

  // Extract unique filter values dynamically from rawData
  // This runs whenever rawData changes, making filter options dynamic
  const filterOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return { sites: [], genders: [], treatments: [] }
    }

    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const sites = new Set<string>()
    const genders = new Set<string>()
    const treatments = new Set<string>()

    rawData.forEach((row) => {
      // Try canonical field names first (from mapping wizard transformation)
      let siteId = row['siteId'] || row['siteid']
      let gender = row['gender'] || row['sex']
      let treatment = row['treatment'] || row['treatmentgroup'] || row['arm'] || row['treatmentGroup']
      
      // Fallback to normalized lookup if canonical names not found
      if (!siteId || !gender || !treatment) {
        const normalizedRow: Record<string, any> = {}
        Object.keys(row).forEach((key) => {
          normalizedRow[normalizeKey(key)] = row[key]
        })
        
        if (!siteId) {
          siteId = normalizedRow['siteid'] || normalizedRow['site_id'] || normalizedRow['site']
        }
        if (!gender) {
          gender = normalizedRow['gender'] || normalizedRow['sex']
        }
        if (!treatment) {
          treatment = normalizedRow['treatment'] || normalizedRow['treatmentgroup'] || normalizedRow['arm']
        }
      }

      // Add unique values to sets
      if (siteId) sites.add(String(siteId))
      if (gender) genders.add(String(gender).charAt(0).toUpperCase())
      if (treatment) treatments.add(String(treatment))
    })

    return {
      sites: Array.from(sites).sort(),
      genders: Array.from(genders).sort(),
      treatments: Array.from(treatments).sort()
    }
  }, [rawData])

  // Filter raw data dynamically based on selected filters
  const filteredRawData = useMemo(() => {
    if (!rawData) return []
    if (filters.site === 'all' && filters.gender === 'all' && filters.treatment === 'all') {
      return rawData
    }

    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    
    return rawData.filter((row) => {
      // Try canonical field names first (from mapping wizard transformation)
      let siteId = row['siteId'] || row['siteid']
      let gender = row['gender'] || row['sex']
      let treatment = row['treatment'] || row['treatmentgroup'] || row['arm'] || row['treatmentGroup']
      
      // Fallback to normalized lookup if canonical names not found
      if (!siteId || !gender || !treatment) {
        const normalizedRow: Record<string, any> = {}
        Object.keys(row).forEach((key) => {
          normalizedRow[normalizeKey(key)] = row[key]
        })
        
        if (!siteId) {
          siteId = normalizedRow['siteid'] || normalizedRow['site_id'] || normalizedRow['site']
        }
        if (!gender) {
          gender = normalizedRow['gender'] || normalizedRow['sex']
        }
        if (!treatment) {
          treatment = normalizedRow['treatment'] || normalizedRow['treatmentgroup'] || normalizedRow['arm']
        }
      }

      // Apply filters
      if (filters.site !== 'all' && String(siteId) !== filters.site) return false
      if (filters.gender !== 'all' && String(gender).charAt(0).toUpperCase() !== filters.gender) return false
      if (filters.treatment !== 'all' && String(treatment) !== filters.treatment) return false

      return true
    })
  }, [rawData, filters])

  const handleExportCSV = () => {
    if (!filteredRawData || filteredRawData.length === 0) return

    const headers = Object.keys(filteredRawData[0])
    const csvContent = [
      headers.join(','),
      ...filteredRawData.map(row => 
        headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          const stringValue = String(value)
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `filtered_data_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const hasActiveFilters = filters.site !== 'all' || filters.gender !== 'all' || filters.treatment !== 'all'

  const clearFilters = () => {
    setFilters({ site: 'all', gender: 'all', treatment: 'all' })
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Adaptive Data Dashboard</h2>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
          <DataUpload />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.site}
              onChange={(e) => setFilters({ ...filters, site: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Sites</option>
              {filterOptions.sites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>

            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Genders</option>
              {filterOptions.genders.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>

            <select
              value={filters.treatment}
              onChange={(e) => setFilters({ ...filters, treatment: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Treatments</option>
              {filterOptions.treatments.map(treatment => (
                <option key={treatment} value={treatment}>{treatment}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredRawData.length} of {rawData.length} records
            </div>
          )}
        </div>
      </div>

      {/* Dataset Overview */}
      {insights && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dataset Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-gray-900">Data Visualizations</h3>
            <p className="text-sm text-gray-500">
              {visualizableColumns.length} charts generated from your data
              {hasActiveFilters && ` (filtered: ${filteredRawData.length} records)`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {visualizableColumns.map((column) => (
              <AdaptiveChart
                key={column.name}
                profile={column}
                rawData={filteredRawData}
              />
            ))}
          </div>
        </>
      )}

      {/* Clinical-specific section (only if structure matches) */}
      {hasClinicalStructure && clinicalData.sites.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Performance</h3>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.sitePerformance.map((site) => (
                  <tr key={site.siteId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {site.siteId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.siteName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.enrollmentCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {Math.round(site.completionRate)}%
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/site/${site.siteId}`)}
                        className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
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

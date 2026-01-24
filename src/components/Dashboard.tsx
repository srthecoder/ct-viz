import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import DataUpload from './DataUpload'
import AdaptiveChart from './AdaptiveChart'
import LandingPage from './LandingPage'
import LabResultsView from './LabResultsView'
import MedicationView from './MedicationView'
import BillingView from './BillingView'
import CollapsibleSection from './CollapsibleSection'
import ScrollReplacementContainer from './ScrollReplacementContainer'
import { 
  Database,
  TrendingUp,
  FileText,
  BarChart3,
  Filter,
  Download,
  X,
  Activity,
  Pill,
  DollarSign,
  Building2
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { clinicalData, metrics, rawData } = useData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<{
    site: string
    gender: string
    treatment: string
    species: string
  }>({
    site: 'all',
    gender: 'all',
    treatment: 'all',
    species: 'all'
  })

  // Extract unique filter values dynamically from rawData
  // This runs whenever rawData changes, making filter options dynamic
  const filterOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return { sites: [], genders: [], treatments: [], species: [] }
    }

    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const sites = new Set<string>()
    const genders = new Set<string>()
    const treatments = new Set<string>()
    const species = new Set<string>()

    rawData.forEach((row) => {
      // Try canonical field names first (from mapping wizard transformation)
      let siteId = row['siteId'] || row['siteid']
      let gender = row['gender'] || row['sex']
      let treatment = row['treatment'] || row['treatmentgroup'] || row['arm'] || row['treatmentGroup']
      let speciesValue = row['species'] || row['animalType'] || row['animal_type']
      
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
        if (!speciesValue) {
          speciesValue = normalizedRow['species'] || normalizedRow['animaltype'] || normalizedRow['animal_type']
        }
      }

      // Add unique values to sets
      if (siteId) sites.add(String(siteId))
      if (gender) genders.add(String(gender).charAt(0).toUpperCase())
      if (treatment) treatments.add(String(treatment))
      if (speciesValue) species.add(String(speciesValue))
    })

    return {
      sites: Array.from(sites).sort(),
      genders: Array.from(genders).sort(),
      treatments: Array.from(treatments).sort(),
      species: Array.from(species).sort()
    }
  }, [rawData])

  // Filter raw data dynamically based on selected filters
  const filteredRawData = useMemo(() => {
    if (!rawData) return []
    if (filters.site === 'all' && filters.gender === 'all' && filters.treatment === 'all' && filters.species === 'all') {
      return rawData
    }

    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    
    return rawData.filter((row) => {
      // Try canonical field names first (from mapping wizard transformation)
      let siteId = row['siteId'] || row['siteid']
      let gender = row['gender'] || row['sex']
      let treatment = row['treatment'] || row['treatmentgroup'] || row['arm'] || row['treatmentGroup']
      let speciesValue = row['species'] || row['animalType'] || row['animal_type']
      
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
        if (!speciesValue) {
          speciesValue = normalizedRow['species'] || normalizedRow['animaltype'] || normalizedRow['animal_type']
        }
      }

      // Apply filters
      if (filters.site !== 'all' && String(siteId) !== filters.site) return false
      if (filters.gender !== 'all' && String(gender).charAt(0).toUpperCase() !== filters.gender) return false
      if (filters.treatment !== 'all' && String(treatment) !== filters.treatment) return false
      if (filters.species !== 'all' && String(speciesValue) !== filters.species) return false

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

  const hasActiveFilters = filters.site !== 'all' || filters.gender !== 'all' || filters.treatment !== 'all' || filters.species !== 'all'

  const clearFilters = () => {
    setFilters({ site: 'all', gender: 'all', treatment: 'all', species: 'all' })
  }


  if (!clinicalData || !metrics || !rawData) {
    return <LandingPage />
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

  // Check if we have lab, medication, or billing data (used for both metrics and tabs)
  const hasLabData = useMemo(() => rawData.some(row => {
    const keys = Object.keys(row).map(k => k.toLowerCase())
    return keys.some(k => ['wbc', 'rbc', 'hemoglobin', 'hematocrit', 'platelets'].includes(k))
  }), [rawData])
  const hasMedicationData = useMemo(() => rawData.some(row => {
    const keys = Object.keys(row).map(k => k.toLowerCase())
    return keys.some(k => ['medication', 'drug', 'prescription', 'dosage'].includes(k))
  }), [rawData])
  const hasBillingData = useMemo(() => rawData.some(row => {
    const keys = Object.keys(row).map(k => k.toLowerCase())
    return keys.some(k => ['amount', 'cost', 'payment', 'billing', 'balance'].includes(k))
  }), [rawData])

  // Add dataset-level metrics - make them veterinary-relevant

  const activePatients = clinicalData.patients.filter(p => p.status === 'Active' || p.status === 'active').length
  const activePercent = clinicalData.patients.length > 0 
    ? Math.round((activePatients / clinicalData.patients.length) * 100) 
    : 0

  const datasetMetrics: Array<{
    title: string
    value: string | number
    subtitle: string
    icon: React.ReactNode
    color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'red'
  }> = [
    {
      title: 'Total Patients',
      value: clinicalData.patients.length,
      subtitle: `${clinicalData.sites.length} clinics`,
      icon: <Database className="h-5 w-5" />,
      color: 'blue'
    },
    {
      title: 'Active Patients',
      value: activePatients,
      subtitle: `${activePercent}% of total`,
      icon: <FileText className="h-5 w-5" />,
      color: 'green'
    }
  ]

  if (hasLabData) {
    datasetMetrics.push({
      title: 'Lab Results',
      value: 'Available',
      subtitle: 'Blood tests tracked',
      icon: <Activity className="h-5 w-5" />,
      color: 'orange'
    })
  }

  if (hasMedicationData) {
    datasetMetrics.push({
      title: 'Medications',
      value: 'Tracked',
      subtitle: 'Administration records',
      icon: <Pill className="h-5 w-5" />,
      color: 'blue'
    })
  }

  if (hasBillingData) {
    datasetMetrics.push({
      title: 'Billing Data',
      value: 'Available',
      subtitle: 'Financial records',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'green'
    })
  }

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

  // Build sections array for horizontal scrolling
  const sections: React.ReactNode[] = []
  const sectionTitles: string[] = []

  // Overview Section
  sections.push(
    <div key="overview" className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Overview</h2>
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
      <CollapsibleSection
        title="Filters"
        icon={<Filter className="h-5 w-5" />}
        defaultOpen={false}
        badge={hasActiveFilters ? `${filteredRawData.length}/${rawData.length}` : undefined}
      >
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

            {filterOptions.species.length > 0 && (
              <select
                value={filters.species}
                onChange={(e) => setFilters({ ...filters, species: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Species</option>
                {filterOptions.species.map(species => (
                  <option key={species} value={species}>{species}</option>
                ))}
              </select>
            )}

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
      </CollapsibleSection>

      {/* Dataset Overview */}
      {insights && (
        <CollapsibleSection
          title="Overview Metrics"
          icon={<BarChart3 className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {datasetMetrics.map((metric, idx) => (
              <MetricCard key={idx} {...metric} />
            ))}
            {dynamicMetrics.slice(0, 2).map((metric, idx) => (
              <MetricCard key={`dynamic-${idx}`} {...metric} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Key Insights */}
      {insights && insights.highlights.length > 0 && (
        <CollapsibleSection
          title="Key Insights"
          icon={<BarChart3 className="h-5 w-5" />}
          defaultOpen={false}
          badge={insights.highlights.length}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        >
          <ul className="space-y-2">
            {insights.highlights.slice(0, 6).map((highlight, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Adaptive Visualizations */}
      {visualizableColumns.length > 0 && (
        <CollapsibleSection
          title="Data Visualizations"
          icon={<BarChart3 className="h-5 w-5" />}
          defaultOpen={true}
          badge={visualizableColumns.length}
        >
          <p className="text-sm text-gray-500 mb-4">
            {visualizableColumns.length} charts generated from your data
            {hasActiveFilters && ` (filtered: ${filteredRawData.length} records)`}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {visualizableColumns.map((column) => (
              <AdaptiveChart
                key={column.name}
                profile={column}
                rawData={filteredRawData}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Clinical-specific section (only if structure matches) */}
      {hasClinicalStructure && clinicalData.sites.length > 0 && (
        <CollapsibleSection
          title="Clinic Performance"
          icon={<Building2 className="h-5 w-5" />}
          defaultOpen={false}
          badge={clinicalData.sites.length}
        >
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clinic Name
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
        </CollapsibleSection>
      )}
      </div>
    </div>
  )
  sectionTitles.push('Overview')

  // Lab Results Section
  if (hasLabData) {
    sections.push(
      <div key="lab" className="h-full overflow-y-auto bg-gradient-to-br from-red-50/50 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Lab Results</h2>
          <LabResultsView rawData={filteredRawData} />
        </div>
      </div>
    )
    sectionTitles.push('Lab Results')
  }

  // Medications Section
  if (hasMedicationData) {
    sections.push(
      <div key="medications" className="h-full overflow-y-auto bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Medications</h2>
          <MedicationView rawData={filteredRawData} />
        </div>
      </div>
    )
    sectionTitles.push('Medications')
  }

  // Billing Section
  if (hasBillingData) {
    sections.push(
      <div key="billing" className="h-full overflow-y-auto bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Billing</h2>
          <BillingView rawData={filteredRawData} />
        </div>
      </div>
    )
    sectionTitles.push('Billing')
  }

  return (
    <ScrollReplacementContainer sectionTitles={sectionTitles}>
      {sections}
    </ScrollReplacementContainer>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'red'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600',
    red: 'bg-red-100 text-red-600'
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

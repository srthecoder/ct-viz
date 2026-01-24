import React, { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface LabResultsViewProps {
  rawData: any[]
}

const LabResultsView: React.FC<LabResultsViewProps> = ({ rawData }) => {
  const [selectedPatient, setSelectedPatient] = useState<string>('all')
  const [selectedParameter, setSelectedParameter] = useState<string>('all')

  // Common lab parameters for veterinary practice
  const labParameters = [
    { key: 'WBC', name: 'White Blood Cells', unit: '×10³/µL', normalRange: { min: 6.0, max: 17.0 } },
    { key: 'RBC', name: 'Red Blood Cells', unit: '×10⁶/µL', normalRange: { min: 5.5, max: 8.5 } },
    { key: 'Hemoglobin', name: 'Hemoglobin', unit: 'g/dL', normalRange: { min: 12.0, max: 18.0 } },
    { key: 'Hematocrit', name: 'Hematocrit', unit: '%', normalRange: { min: 37.0, max: 55.0 } },
    { key: 'Platelets', name: 'Platelets', unit: '/µL', normalRange: { min: 200000, max: 500000 } },
    { key: 'Glucose', name: 'Glucose', unit: 'mg/dL', normalRange: { min: 70, max: 120 } },
    { key: 'BUN', name: 'BUN', unit: 'mg/dL', normalRange: { min: 10, max: 30 } },
    { key: 'Creatinine', name: 'Creatinine', unit: 'mg/dL', normalRange: { min: 0.5, max: 1.8 } },
    { key: 'ALT', name: 'ALT', unit: 'U/L', normalRange: { min: 10, max: 100 } },
    { key: 'AST', name: 'AST', unit: 'U/L', normalRange: { min: 15, max: 60 } }
  ]

  // Detect available lab parameters in data
  const availableParameters = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const firstRow = rawData[0]
    const keys = Object.keys(firstRow).map(normalizeKey)
    
    return labParameters.filter(param => {
      const paramKey = normalizeKey(param.key)
      return keys.includes(paramKey) || keys.some(k => k.includes(paramKey))
    })
  }, [rawData])

  // Get unique patients
  const patients = useMemo(() => {
    if (!rawData) return []
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const patientSet = new Set<string>()
    
    rawData.forEach(row => {
      const normalizedRow: Record<string, any> = {}
      Object.keys(row).forEach(key => {
        normalizedRow[normalizeKey(key)] = row[key]
      })
      const patientId = normalizedRow['patientid'] || normalizedRow['patient_id'] || normalizedRow['id']
      if (patientId) patientSet.add(String(patientId))
    })
    
    return Array.from(patientSet).sort()
  }, [rawData])

  // Prepare historical data for selected patient
  const historicalData = useMemo(() => {
    if (!rawData || selectedPatient === 'all' || selectedParameter === 'all') return []
    
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const param = availableParameters.find(p => p.key === selectedParameter)
    if (!param) return []
    
    const paramKey = normalizeKey(param.key)
    const patientData = rawData
      .filter(row => {
        const normalizedRow: Record<string, any> = {}
        Object.keys(row).forEach(key => {
          normalizedRow[normalizeKey(key)] = row[key]
        })
        const patientId = normalizedRow['patientid'] || normalizedRow['patient_id'] || normalizedRow['id']
        return String(patientId) === selectedPatient
      })
      .map(row => {
        const normalizedRow: Record<string, any> = {}
        Object.keys(row).forEach(key => {
          normalizedRow[normalizeKey(key)] = row[key]
        })
        
        const dateKey = normalizeKey('date') || normalizeKey('enrollmentdate') || normalizeKey('visitdate')
        const date = normalizedRow[dateKey] || row['date'] || row['enrollmentDate'] || row['visitDate']
        const value = normalizedRow[paramKey] || row[param.key]
        
        return {
          date: date ? String(date).split('T')[0] : 'Unknown',
          value: value ? parseFloat(String(value)) : null,
          parameter: param.name
        }
      })
      .filter(item => item.value !== null && !isNaN(item.value))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return patientData
  }, [rawData, selectedPatient, selectedParameter, availableParameters])

  // Current vs Historical comparison
  const comparisonData = useMemo(() => {
    if (!rawData || selectedParameter === 'all') return []
    
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const param = availableParameters.find(p => p.key === selectedParameter)
    if (!param) return []
    
    const paramKey = normalizeKey(param.key)
    const allValues = rawData
      .map(row => {
        const normalizedRow: Record<string, any> = {}
        Object.keys(row).forEach(key => {
          normalizedRow[normalizeKey(key)] = row[key]
        })
        const value = normalizedRow[paramKey] || row[param.key]
        return value ? parseFloat(String(value)) : null
      })
      .filter(v => v !== null && !isNaN(v)) as number[]
    
    if (allValues.length === 0) return []
    
    const current = allValues[allValues.length - 1]
    const historical = allValues.slice(0, -1)
    const historicalAvg = historical.length > 0 
      ? historical.reduce((a, b) => a + b, 0) / historical.length 
      : current
    
    return {
      current,
      historicalAvg,
      change: current - historicalAvg,
      changePercent: historicalAvg > 0 ? ((current - historicalAvg) / historicalAvg) * 100 : 0,
      normalRange: param.normalRange,
      isAbnormal: current < param.normalRange.min || current > param.normalRange.max
    }
  }, [rawData, selectedParameter, availableParameters])

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!rawData || availableParameters.length === 0) return []
    
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    
    return availableParameters.map(param => {
      const paramKey = normalizeKey(param.key)
      const values = rawData
        .map(row => {
          const normalizedRow: Record<string, any> = {}
          Object.keys(row).forEach(key => {
            normalizedRow[normalizeKey(key)] = row[key]
          })
          const value = normalizedRow[paramKey] || row[param.key]
          return value ? parseFloat(String(value)) : null
        })
        .filter(v => v !== null && !isNaN(v)) as number[]
      
      if (values.length === 0) return null
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      const abnormalCount = values.filter(v => 
        v < param.normalRange.min || v > param.normalRange.max
      ).length
      
      return {
        parameter: param.name,
        key: param.key,
        avg: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        abnormalCount,
        totalCount: values.length,
        abnormalPercent: (abnormalCount / values.length) * 100,
        normalRange: param.normalRange
      }
    }).filter(Boolean)
  }, [rawData, availableParameters])

  if (availableParameters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No lab result data found in the uploaded dataset.</p>
        <p className="text-sm text-gray-500 mt-2">
          Include columns like WBC, RBC, Hemoglobin, Hematocrit, Platelets, etc.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-600" />
            Lab Results Analysis
          </h2>
          <p className="text-gray-600 mt-1">Track and compare blood test results over time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Patients</option>
              {patients.map(patient => (
                <option key={patient} value={patient}>{patient}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Parameter</label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Parameters</option>
              {availableParameters.map(param => (
                <option key={param.key} value={param.key}>{param.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Current vs Historical Comparison */}
      {comparisonData && !Array.isArray(comparisonData) && comparisonData.current !== undefined && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current vs. Historical Average</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Current Value</p>
              <p className="text-2xl font-bold text-blue-600">
                {comparisonData.current.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {availableParameters.find(p => p.key === selectedParameter)?.unit}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Historical Average</p>
              <p className="text-2xl font-bold text-green-600">
                {comparisonData.historicalAvg.toFixed(2)}
              </p>
            </div>
            <div className={`rounded-lg p-4 ${comparisonData.change >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Change</p>
              <div className="flex items-center gap-2">
                {comparisonData.change >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                )}
                <p className={`text-2xl font-bold ${comparisonData.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {comparisonData.change >= 0 ? '+' : ''}{comparisonData.change.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ({comparisonData.changePercent >= 0 ? '+' : ''}{comparisonData.changePercent.toFixed(1)}%)
              </p>
            </div>
            <div className={`rounded-lg p-4 ${comparisonData.isAbnormal ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <div className="flex items-center gap-2">
                {comparisonData.isAbnormal && <AlertCircle className="h-5 w-5 text-red-600" />}
                <p className={`text-lg font-bold ${comparisonData.isAbnormal ? 'text-red-600' : 'text-green-600'}`}>
                  {comparisonData.isAbnormal ? 'Abnormal' : 'Normal'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Range: {comparisonData.normalRange.min} - {comparisonData.normalRange.max}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Chart */}
      {historicalData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historical Trend: {availableParameters.find(p => p.key === selectedParameter)?.name}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <ReferenceLine 
                y={availableParameters.find(p => p.key === selectedParameter)?.normalRange.min} 
                stroke="orange" 
                strokeDasharray="5 5"
                label="Min Normal"
              />
              <ReferenceLine 
                y={availableParameters.find(p => p.key === selectedParameter)?.normalRange.max} 
                stroke="orange" 
                strokeDasharray="5 5"
                label="Max Normal"
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                name={availableParameters.find(p => p.key === selectedParameter)?.name}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abnormal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryStats.map((stat, idx) => {
                if (!stat) return null
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.parameter}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stat.avg}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stat.min}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stat.max}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.abnormalCount} ({stat.abnormalPercent.toFixed(1)}%)
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stat.abnormalPercent > 20 
                          ? 'bg-red-100 text-red-800' 
                          : stat.abnormalPercent > 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {stat.abnormalPercent > 20 ? 'High Alert' : stat.abnormalPercent > 10 ? 'Monitor' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LabResultsView

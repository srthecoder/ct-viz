import React, { useMemo } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface LabResultsViewProps {
  rawData: any[]
  patientId?: string
}

const LabResultsView: React.FC<LabResultsViewProps> = ({ rawData, patientId }) => {
  // Lab result columns (common veterinary blood test parameters)
  const labColumns = ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'Platelets', 'Glucose', 'BUN', 'Creatinine', 'ALT', 'AST']
  
  // Filter data by patient if specified
  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    if (patientId) {
      return rawData.filter(row => {
        const pid = row['patientId'] || row['patient_id'] || row['id']
        return String(pid) === String(patientId)
      })
    }
    return rawData
  }, [rawData, patientId])

  // Find available lab columns in the data
  const availableLabColumns = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return []
    const firstRow = filteredData[0]
    return labColumns.filter(col => {
      const normalizedCol = col.toLowerCase()
      return Object.keys(firstRow).some(key => 
        key.toLowerCase() === normalizedCol || 
        key.toLowerCase().includes(normalizedCol.toLowerCase())
      )
    })
  }, [filteredData])

  // Prepare time series data for each lab parameter
  const labTimeSeries = useMemo(() => {
    if (!filteredData || filteredData.length === 0 || availableLabColumns.length === 0) return []

    return availableLabColumns.map(labCol => {
      // Find the actual column name (case-insensitive)
      const actualCol = Object.keys(filteredData[0]).find(key => 
        key.toLowerCase() === labCol.toLowerCase() || 
        key.toLowerCase().includes(labCol.toLowerCase())
      )

      if (!actualCol) return null

      const data = filteredData
        .map(row => {
          const date = row['enrollmentDate'] || row['enrollment_date'] || row['date'] || row['visitDate'] || row['visit_date']
          const value = parseFloat(row[actualCol])
          if (!date || isNaN(value)) return null
          return {
            date: date.split('T')[0],
            value: value,
            patientId: row['patientId'] || row['patient_id'] || row['id']
          }
        })
        .filter(item => item !== null)
        .sort((a, b) => a!.date.localeCompare(b!.date))

      // Calculate trend
      if (data.length < 2) return null

      const firstValue = data[0]!.value
      const lastValue = data[data.length - 1]!.value
      const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable'
      const changePercent = ((lastValue - firstValue) / firstValue) * 100

      return {
        name: labCol,
        data: data.map(d => ({
          date: d!.date.split('-').slice(1).join('/'), // MM/DD format
          value: d!.value,
          fullDate: d!.date
        })),
        trend,
        changePercent: Math.abs(changePercent).toFixed(1),
        currentValue: lastValue,
        previousValue: data.length > 1 ? data[data.length - 2]!.value : null
      }
    }).filter(item => item !== null && item.data.length > 0)
  }, [filteredData, availableLabColumns])

  if (availableLabColumns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No lab result data available in the current dataset.</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload data with columns like WBC, RBC, Hemoglobin, Hematocrit, Platelets, etc.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-red-600" />
          Lab Results Analysis
          {patientId && <span className="text-sm font-normal text-gray-500">(Patient: {patientId})</span>}
        </h3>
      </div>

      {/* Lab Result Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labTimeSeries.map((lab, idx) => {
          if (!lab) return null
          
          const TrendIcon = lab.trend === 'up' ? TrendingUp : lab.trend === 'down' ? TrendingDown : Minus
          const trendColor = lab.trend === 'up' ? 'text-red-600' : lab.trend === 'down' ? 'text-green-600' : 'text-gray-600'

          return (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{lab.name}</h4>
                <div className={`flex items-center gap-1 ${trendColor}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {lab.trend === 'up' ? '+' : lab.trend === 'down' ? '-' : ''}{lab.changePercent}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {lab.currentValue.toFixed(1)}
              </div>
              {lab.previousValue && (
                <div className="text-xs text-gray-500">
                  Previous: {lab.previousValue.toFixed(1)}
                </div>
              )}
              {lab.data.length > 1 && (
                <div className="mt-3 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lab.data}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={lab.trend === 'up' ? '#ef4444' : lab.trend === 'down' ? '#10b981' : '#6b7280'} 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Detailed Time Series Charts */}
      {labTimeSeries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {labTimeSeries.slice(0, 4).map((lab, idx) => {
            if (!lab || lab.data.length < 2) return null
            return (
              <div key={idx} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">{lab.name} Over Time</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lab.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name={lab.name}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LabResultsView

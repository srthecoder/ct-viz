import React from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { ColumnProfile } from '../types'
import {
  generateCategoricalChartData,
  generateNumericChartData,
  generateTimeSeriesData,
  getRecommendedChartType,
  ChartDataPoint,
  TimeSeriesDataPoint
} from '../utils/chartDataGenerator'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4']

interface AdaptiveChartProps {
  profile: ColumnProfile
  rawData: any[]
}

const AdaptiveChart: React.FC<AdaptiveChartProps> = ({ profile, rawData }) => {
  const chartType = getRecommendedChartType(profile)
  
  let chartData: ChartDataPoint[] | TimeSeriesDataPoint[] = []
  let isTimeSeries = false

  if (profile.type === 'categorical') {
    chartData = generateCategoricalChartData(rawData, profile.name)
  } else if (profile.type === 'numeric') {
    chartData = generateNumericChartData(rawData, profile.name, 15)
  } else if (profile.type === 'date') {
    chartData = generateTimeSeriesData(rawData, profile.name, 'month')
    isTimeSeries = true
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{profile.name}</h3>
        <p className="text-gray-500 text-sm">No data available for this column</p>
      </div>
    )
  }

  const renderChart = () => {
    if (chartType === 'pie') {
      const data = chartData as ChartDataPoint[]
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'line' || isTimeSeries) {
      const data = chartData as TimeSeriesDataPoint[]
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // bar or histogram
    const data = chartData as ChartDataPoint[]
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={data.length > 10 ? -45 : 0}
            textAnchor={data.length > 10 ? 'end' : 'middle'}
            height={data.length > 10 ? 80 : 30}
          />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#0ea5e9" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{profile.name}</h3>
      <p className="text-xs text-gray-500 mb-4">
        {profile.type} • {profile.unique} unique values • {profile.missing} missing
      </p>
      {renderChart()}
    </div>
  )
}

export default AdaptiveChart


import React, { useRef } from 'react'
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
import { Image as ImageIcon } from 'lucide-react'
import { ColumnProfile } from '../types'
import {
  generateCategoricalChartData,
  generateNumericChartData,
  generateTimeSeriesData,
  getRecommendedChartType,
  ChartDataPoint,
  TimeSeriesDataPoint
} from '../utils/chartDataGenerator'

// Improved color palette with better balance and accessibility
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1'  // indigo-500
]

interface AdaptiveChartProps {
  profile: ColumnProfile
  rawData: any[]
}

const AdaptiveChart: React.FC<AdaptiveChartProps> = ({ profile, rawData }) => {
  const chartRef = useRef<HTMLDivElement>(null)
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

  const handleExportPNG = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!chartRef.current) return
    
    // Find the chart container (the div with ResponsiveContainer)
    const chartContainer = chartRef.current.querySelector('.recharts-wrapper')
    if (!chartContainer) {
      // Fallback: try to find any SVG
      const svg = chartRef.current.querySelector('svg')
      if (!svg) {
        alert('Chart not found. Please try again.')
        return
      }
      exportSVGToPNG(svg)
      return
    }
    
    // Get the SVG from the Recharts wrapper
    const svg = chartContainer.querySelector('svg') as SVGElement
    if (!svg) {
      alert('Chart SVG not found. Please try again.')
      return
    }
    
    exportSVGToPNG(svg)
  }

  const exportSVGToPNG = (svg: SVGElement) => {
    try {
      // Get dimensions from the SVG or its container
      let width = parseInt(svg.getAttribute('width') || '0', 10)
      let height = parseInt(svg.getAttribute('height') || '0', 10)
      
      // If width/height not set, try to get from viewBox
      if (!width || !height) {
        const viewBox = svg.getAttribute('viewBox')
        if (viewBox) {
          const parts = viewBox.split(' ')
          if (parts.length >= 4) {
            width = parseInt(parts[2], 10) || 800
            height = parseInt(parts[3], 10) || 400
          }
        }
      }
      
      // Fallback to container dimensions
      if (!width || !height) {
        const container = svg.closest('.recharts-wrapper') as HTMLElement
        if (container) {
          width = container.offsetWidth || 800
          height = container.offsetHeight || 400
        } else {
          width = 800
          height = 400
        }
      }
      
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svg.cloneNode(true) as SVGElement
      
      // Ensure dimensions are set
      clonedSvg.setAttribute('width', String(width))
      clonedSvg.setAttribute('height', String(height))
      
      // Preserve viewBox if it exists
      if (!clonedSvg.getAttribute('viewBox') && svg.getAttribute('viewBox')) {
        clonedSvg.setAttribute('viewBox', svg.getAttribute('viewBox')!)
      }
      
      // Serialize to string
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      
      // Create a data URL with proper encoding
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Use higher resolution for better quality
        const scale = 2
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          // Fill white background
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // Scale and draw the SVG image
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to PNG and download
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a')
              link.download = `${profile.name.replace(/[^a-z0-9]/gi, '_')}_chart.png`
              link.href = URL.createObjectURL(blob)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(link.href)
            }
          }, 'image/png', 1.0)
        }
        URL.revokeObjectURL(url)
      }
      
      img.onerror = () => {
        console.error('Failed to load SVG for export')
        URL.revokeObjectURL(url)
        alert('Failed to export chart. Please try again.')
      }
      
      img.src = url
    } catch (error) {
      console.error('Error exporting chart:', error)
      alert('Failed to export chart. Please try again.')
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{profile.name}</h3>
        <p className="text-gray-500 text-sm">No data available for this column</p>
      </div>
    )
  }

  const formatLabel = (label: string) => {
    return label
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const renderChart = () => {
    if (chartType === 'pie') {
      const data = chartData as ChartDataPoint[]
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => {
                const displayName = name.length > 15 ? name.substring(0, 12) + '...' : name
                return `${displayName}: ${(percent * 100).toFixed(1)}%`
              }}
              outerRadius={90}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, 'Count']}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => value.length > 20 ? value.substring(0, 17) + '...' : value}
            />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'line' || isTimeSeries) {
      const data = chartData as TimeSeriesDataPoint[]
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={data.length > 12 ? -45 : 0}
              textAnchor={data.length > 12 ? 'end' : 'middle'}
              height={data.length > 12 ? 80 : 30}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' 
              }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke={COLORS[0]} 
              strokeWidth={3}
              dot={{ fill: COLORS[0], r: 4 }}
              activeDot={{ r: 6 }}
              name="Count"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // bar or histogram
    const data = chartData as ChartDataPoint[]
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={data.length > 10 ? -45 : 0}
            textAnchor={data.length > 10 ? 'end' : 'middle'}
            height={data.length > 10 ? 80 : 30}
            interval={data.length > 15 ? 'preserveStartEnd' : 0}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' 
            }}
            labelStyle={{ color: '#111827', fontWeight: 600 }}
            formatter={(value: number) => [value, 'Count']}
          />
          <Bar 
            dataKey="value" 
            fill={COLORS[0]}
            radius={[4, 4, 0, 0]}
            name="Count"
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div ref={chartRef} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {formatLabel(profile.name)}
          </h3>
          <p className="text-xs text-gray-500">
            {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} • {profile.unique} unique • {profile.missing} missing
          </p>
        </div>
        <button
          onClick={handleExportPNG}
          className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Export as PNG"
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="w-full">
        {renderChart()}
      </div>
    </div>
  )
}

export default AdaptiveChart


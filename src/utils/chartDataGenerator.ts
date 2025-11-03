import { ColumnProfile } from '../types'

export interface ChartDataPoint {
  name: string
  value: number
}

export interface TimeSeriesDataPoint {
  date: string
  count: number
}

/**
 * Generates chart data for a categorical column (pie/bar chart)
 */
export const generateCategoricalChartData = (
  rawData: any[],
  columnName: string
): ChartDataPoint[] => {
  const counts = new Map<string, number>()
  
  rawData.forEach((row) => {
    const value = row?.[columnName]
    if (value !== undefined && value !== null && value !== '') {
      const key = String(value).trim()
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  })

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Generates histogram data for a numeric column (bar chart with bins)
 */
export const generateNumericChartData = (
  rawData: any[],
  columnName: string,
  bins: number = 10
): ChartDataPoint[] => {
  const values = rawData
    .map((row) => {
      const val = row?.[columnName]
      const num = typeof val === 'number' ? val : parseFloat(String(val))
      return isNaN(num) ? null : num
    })
    .filter((v): v is number => v !== null)

  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binSize = (max - min) / bins

  const binsMap = new Map<string, number>()
  
  // Initialize bins
  for (let i = 0; i < bins; i++) {
    const binStart = min + i * binSize
    const binEnd = binStart + binSize
    const label = i === bins - 1 
      ? `${Math.round(binStart)}-${Math.round(binEnd)}`
      : `${Math.round(binStart)}-${Math.round(binEnd)}`
    binsMap.set(label, 0)
  }

  // Count values in each bin
  values.forEach((val) => {
    let binIndex = Math.floor((val - min) / binSize)
    if (binIndex >= bins) binIndex = bins - 1
    
    const binStart = min + binIndex * binSize
    const binEnd = binStart + binSize
    const label = binIndex === bins - 1
      ? `${Math.round(binStart)}-${Math.round(binEnd)}`
      : `${Math.round(binStart)}-${Math.round(binEnd)}`
    
    binsMap.set(label, (binsMap.get(label) || 0) + 1)
  })

  return Array.from(binsMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)
}

/**
 * Generates time series data for a date column (line chart)
 */
export const generateTimeSeriesData = (
  rawData: any[],
  columnName: string,
  groupBy: 'day' | 'week' | 'month' = 'month'
): TimeSeriesDataPoint[] => {
  const dateCounts = new Map<string, number>()

  rawData.forEach((row) => {
    const val = row?.[columnName]
    if (!val) return

    const date = new Date(val)
    if (isNaN(date.getTime())) return

    let key: string
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0] // YYYY-MM-DD
    } else if (groupBy === 'week') {
      const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))
      key = `Week ${week}`
    } else {
      // month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    dateCounts.set(key, (dateCounts.get(key) || 0) + 1)
  })

  return Array.from(dateCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 50) // Limit to 50 points for performance
}

/**
 * Determines the best chart type for a column profile
 */
export const getRecommendedChartType = (profile: ColumnProfile): 'pie' | 'bar' | 'line' | 'histogram' => {
  if (profile.type === 'date') return 'line'
  if (profile.type === 'numeric') return 'histogram'
  if (profile.type === 'categorical') {
    // Use pie for small categories, bar for many
    return profile.unique <= 8 ? 'pie' : 'bar'
  }
  return 'bar'
}



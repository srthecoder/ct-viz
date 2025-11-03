import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ClinicalData, DashboardMetrics } from '../types'
import { calculateMetrics } from '../utils/dataCleaning'

interface DataContextType {
  clinicalData: ClinicalData | null
  metrics: DashboardMetrics | null
  rawData: any[] | null  // Store raw data for dynamic chart generation
  loadData: (data: ClinicalData, rawData?: any[]) => void
  clearData: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clinicalData, setClinicalData] = useState<ClinicalData | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [rawData, setRawData] = useState<any[] | null>(null)

  const loadData = (data: ClinicalData, rawData?: any[]) => {
    setClinicalData(data)
    setRawData(rawData || null)
    const calculatedMetrics = calculateMetrics(data)
    setMetrics(calculatedMetrics)
  }

  const clearData = () => {
    setClinicalData(null)
    setMetrics(null)
    setRawData(null)
  }

  return (
    <DataContext.Provider value={{ clinicalData, metrics, rawData, loadData, clearData }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}


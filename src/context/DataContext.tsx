import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ClinicalData, DashboardMetrics } from '../types'
import { calculateMetrics } from '../utils/dataCleaning'

interface DataContextType {
  clinicalData: ClinicalData | null
  metrics: DashboardMetrics | null
  loadData: (data: ClinicalData) => void
  clearData: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clinicalData, setClinicalData] = useState<ClinicalData | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  const loadData = (data: ClinicalData) => {
    setClinicalData(data)
    const calculatedMetrics = calculateMetrics(data)
    setMetrics(calculatedMetrics)
  }

  const clearData = () => {
    setClinicalData(null)
    setMetrics(null)
  }

  return (
    <DataContext.Provider value={{ clinicalData, metrics, loadData, clearData }}>
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


export interface Patient {
  patientId: string
  siteId: string
  age: number
  gender: string
  enrollmentDate: string
  status: string
  treatment: string
  visits?: Visit[]
}

export interface Visit {
  visitId: string
  patientId: string
  visitDate: string
  visitNumber: number
  measurements: Record<string, number | string>
}

export interface Site {
  siteId: string
  siteName: string
  location: string
  enrollmentCount: number
  status: string
}

export interface ClinicalData {
  patients: Patient[]
  sites: Site[]
  metadata?: {
    trialName?: string
    startDate?: string
    endDate?: string
  }
}

export interface DashboardMetrics {
  totalPatients: number
  totalSites: number
  activeSites: number
  enrollmentRate: number
  completionRate: number
  statusBreakdown: Record<string, number>
  sitePerformance: Array<{
    siteId: string
    siteName: string
    enrollmentCount: number
    completionRate: number
  }>
}


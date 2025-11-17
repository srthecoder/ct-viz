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
    insights?: DatasetInsights
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

export type ColumnType = 'numeric' | 'categorical' | 'date' | 'text'

export interface ColumnProfile {
  name: string
  type: ColumnType
  count: number
  missing: number
  unique: number
  sampleValues: Array<string | number>
  stats?: {
    min?: number
    max?: number
    mean?: number
    median?: number
  }
  topValues?: Array<{ value: string; count: number }>
  dateRange?: { min?: string; max?: string }
}

export interface DatasetInsights {
  rowCount: number
  columnCount: number
  columns: ColumnProfile[]
  highlights: string[]
}

export type TrialConceptId =
  | 'subjectId'
  | 'siteId'
  | 'visitId'
  | 'treatment'
  | 'status'
  | 'age'
  | 'gender'
  | 'outcome'
  | 'dropout'
  | 'adverseEvent'
  | 'enrollmentDate'
  | 'ignore'
  | 'other'

export interface TrialConceptDefinition {
  id: TrialConceptId
  label: string
  description: string
  required: boolean
  keywords: string[]
}

export interface ColumnMappingState {
  columnName: string
  displayName: string
  concept?: TrialConceptId
  confidence: 'high' | 'medium' | 'low'
  autoMatched: boolean
}


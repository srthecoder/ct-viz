import { ClinicalData, Patient, Site, DashboardMetrics } from '../types'
import Papa from 'papaparse'

export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

export const cleanPatientData = (rawData: any[]): Patient[] => {
  return rawData
    .map((row) => {
      // Normalize column names (case-insensitive, handle spaces)
      const normalizeKey = (key: string) => 
        key.toLowerCase().trim().replace(/\s+/g, '')

      const normalizedRow: Record<string, any> = {}
      Object.keys(row).forEach((key) => {
        normalizedRow[normalizeKey(key)] = row[key]
      })

      // Extract patient data with fallbacks for various column name formats
      const patientId = 
        normalizedRow['patientid'] || 
        normalizedRow['patient_id'] || 
        normalizedRow['id'] ||
        `P${Math.random().toString(36).slice(2, 11)}`

      const siteId = 
        normalizedRow['siteid'] || 
        normalizedRow['site_id'] || 
        normalizedRow['site'] ||
        'SITE-001'

      const age = parseInt(normalizedRow['age'] || '0', 10)
      const gender = 
        (normalizedRow['gender'] || normalizedRow['sex'] || 'Unknown')
          .toString()
          .charAt(0)
          .toUpperCase()

      const enrollmentDate = 
        normalizedRow['enrollmentdate'] || 
        normalizedRow['enrollment_date'] || 
        normalizedRow['date'] ||
        new Date().toISOString().split('T')[0]

      const status = 
        (normalizedRow['status'] || normalizedRow['patientstatus'] || 'Active')
          .toString()
          .trim()

      const treatment = 
        normalizedRow['treatment'] || 
        normalizedRow['treatmentgroup'] || 
        normalizedRow['arm'] ||
        'Control'

      return {
        patientId,
        siteId,
        age: isNaN(age) ? 0 : age,
        gender,
        enrollmentDate,
        status,
        treatment
      }
    })
    .filter((patient) => patient.patientId && patient.siteId)
}

export const extractSites = (patients: Patient[]): Site[] => {
  const siteMap = new Map<string, Site>()

  patients.forEach((patient) => {
    if (!siteMap.has(patient.siteId)) {
      siteMap.set(patient.siteId, {
        siteId: patient.siteId,
        siteName: `Site ${patient.siteId}`,
        location: 'Unknown',
        enrollmentCount: 0,
        status: 'Active'
      })
    }
    const site = siteMap.get(patient.siteId)!
    site.enrollmentCount++
  })

  return Array.from(siteMap.values())
}

export const processClinicalData = (rawData: any[]): ClinicalData => {
  const patients = cleanPatientData(rawData)
  const sites = extractSites(patients)

  return {
    patients,
    sites,
    metadata: {
      trialName: 'Clinical Trial',
      startDate: patients.length > 0 
        ? patients.reduce((earliest, p) => 
            p.enrollmentDate < earliest.enrollmentDate ? p : earliest
          ).enrollmentDate
        : undefined
    }
  }
}

export const calculateMetrics = (data: ClinicalData): DashboardMetrics => {
  const { patients, sites } = data

  const statusBreakdown = patients.reduce((acc, patient) => {
    acc[patient.status] = (acc[patient.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const completedCount = statusBreakdown['Completed'] || statusBreakdown['Complete'] || 0
  const completionRate = patients.length > 0 
    ? (completedCount / patients.length) * 100 
    : 0

  // Calculate enrollment rate (patients per month)
  const enrollmentDates = patients.map(p => new Date(p.enrollmentDate)).sort()
  const daysDiff = enrollmentDates.length > 1
    ? (enrollmentDates[enrollmentDates.length - 1].getTime() - enrollmentDates[0].getTime()) / (1000 * 60 * 60 * 24)
    : 1
  const monthsDiff = Math.max(daysDiff / 30, 1)
  const enrollmentRate = patients.length / monthsDiff

  const sitePerformance = sites.map(site => {
    const sitePatients = patients.filter(p => p.siteId === site.siteId)
    const siteCompleted = sitePatients.filter(p => 
      p.status === 'Completed' || p.status === 'Complete'
    ).length
    return {
      siteId: site.siteId,
      siteName: site.siteName,
      enrollmentCount: site.enrollmentCount,
      completionRate: sitePatients.length > 0 
        ? (siteCompleted / sitePatients.length) * 100 
        : 0
    }
  })

  return {
    totalPatients: patients.length,
    totalSites: sites.length,
    activeSites: sites.filter(s => s.status === 'Active').length,
    enrollmentRate: Math.round(enrollmentRate * 10) / 10,
    completionRate: Math.round(completionRate * 10) / 10,
    statusBreakdown,
    sitePerformance
  }
}

// --- Sample Data Generation (for demo/testing) ---
export const generateSampleClinicalData = (options?: {
  numSites?: number
  numPatients?: number
  startDate?: string
  months?: number
}): ClinicalData => {
  const numSites = options?.numSites ?? 6
  const numPatients = options?.numPatients ?? 250
  const months = Math.max(options?.months ?? 8, 1)

  const start = options?.startDate ? new Date(options.startDate) : new Date()
  start.setMonth(start.getMonth() - months)

  const siteIds = Array.from({ length: numSites }, (_, i) => `SITE-${String(i + 1).padStart(3, '0')}`)
  const treatments = ['Control', 'Treatment A', 'Treatment B']
  const statuses = ['Active', 'Completed', 'Screening', 'Withdrawn']

  const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const randomChoice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

  const patients: Patient[] = Array.from({ length: numPatients }, (_, idx) => {
    const siteId = randomChoice(siteIds)
    const age = randomBetween(18, 85)
    const gender = randomChoice(['M', 'F', 'U'])
    const enrollment = new Date(start)
    enrollment.setDate(enrollment.getDate() + randomBetween(0, months * 30))
    const status = randomChoice(statuses)
    const treatment = randomChoice(treatments)

    return {
      patientId: `P${String(idx + 1).padStart(5, '0')}`,
      siteId,
      age,
      gender,
      enrollmentDate: enrollment.toISOString().split('T')[0],
      status,
      treatment
    }
  })

  const sites = extractSites(patients)

  return {
    patients,
    sites,
    metadata: {
      trialName: 'Sample Clinical Trial',
      startDate: patients.length ? patients.reduce((earliest, p) => p.enrollmentDate < earliest.enrollmentDate ? p : earliest).enrollmentDate : undefined
    }
  }
}


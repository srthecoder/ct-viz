import { ClinicalData, Patient, Site, DashboardMetrics, DatasetInsights, ColumnProfile, ColumnType } from '../types'
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
        siteName: `Clinic ${patient.siteId}`,
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
  const insights = analyzeDataset(rawData)

  return {
    patients,
    sites,
    metadata: {
      trialName: 'Veterinary Trial',
      startDate: patients.length > 0 
        ? patients.reduce((earliest, p) => 
            p.enrollmentDate < earliest.enrollmentDate ? p : earliest
          ).enrollmentDate
        : undefined,
      insights
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

  // Generate raw data for insights
  const rawSampleData = patients.map(p => ({
    patientId: p.patientId,
    siteId: p.siteId,
    age: p.age,
    gender: p.gender,
    enrollmentDate: p.enrollmentDate,
    status: p.status,
    treatment: p.treatment
  }))

  const insights = analyzeDataset(rawSampleData)

  return {
    patients,
    sites,
    metadata: {
      trialName: 'Sample Clinical Trial',
      startDate: patients.length ? patients.reduce((earliest, p) => p.enrollmentDate < earliest.enrollmentDate ? p : earliest).enrollmentDate : undefined,
      insights
    }
  }
}

// --- Generic Dataset Profiling (adaptive insights) ---
export const analyzeDataset = (rawData: any[]): DatasetInsights => {
  const rows = Array.isArray(rawData) ? rawData : []
  const rowCount = rows.length
  const columns = new Set<string>()
  rows.slice(0, 1000).forEach(r => Object.keys(r || {}).forEach(k => columns.add(k)))

  const profiles: ColumnProfile[] = Array.from(columns).map((col) => {
    const values = rows.map(r => (r ? r[col] : undefined)).filter(v => v !== undefined)
    const count = values.length
    const missing = rowCount - count
    const uniqueSet = new Set(values.map(v => (v ?? '').toString()))
    const unique = uniqueSet.size

    // type inference
    const numericVals = values
      .map(v => (typeof v === 'number' ? v : parseFloat((v ?? '').toString())))
      .filter(v => !Number.isNaN(v)) as number[]
    const dateVals = values
      .map(v => new Date(v))
      .filter(d => !isNaN(d.getTime())) as Date[]

    let type: ColumnType = 'text'
    if (numericVals.length >= Math.max(5, count * 0.6)) type = 'numeric'
    else if (dateVals.length >= Math.max(5, count * 0.6)) type = 'date'
    else if (unique <= Math.max(20, count * 0.5)) type = 'categorical'

    const sampleValues = values.slice(0, 5) as Array<string | number>

    const profile: ColumnProfile = {
      name: col,
      type,
      count,
      missing,
      unique,
      sampleValues
    }

    if (type === 'numeric' && numericVals.length) {
      const sorted = [...numericVals].sort((a,b) => a-b)
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      const mean = sorted.reduce((s,v) => s+v, 0) / sorted.length
      const median = sorted[Math.floor(sorted.length / 2)]
      profile.stats = { min, max, mean: Math.round(mean * 100) / 100, median }
    } else if (type === 'categorical') {
      const counts = new Map<string, number>()
      values.forEach(v => {
        const key = (v ?? '').toString()
        counts.set(key, (counts.get(key) || 0) + 1)
      })
      profile.topValues = Array.from(counts.entries())
        .sort((a,b) => b[1]-a[1]).slice(0,5)
        .map(([value, c]) => ({ value, count: c }))
    } else if (type === 'date' && dateVals.length) {
      const sorted = dateVals.sort((a,b) => a.getTime() - b.getTime())
      profile.dateRange = { min: sorted[0].toISOString(), max: sorted[sorted.length-1].toISOString() }
    }

    return profile
  })

  // highlights
  const highlights: string[] = []
  const topCategorical = profiles.filter(p => p.type === 'categorical').sort((a,b) => (b.topValues?.[0]?.count || 0) - (a.topValues?.[0]?.count || 0))[0]
  if (topCategorical?.topValues?.length) {
    const tv = topCategorical.topValues[0]
    highlights.push(`Most dominant category: ${topCategorical.name} → ${tv.value} (${tv.count} records)`) 
  }
  const wideMissing = profiles.filter(p => p.missing > rowCount * 0.2).slice(0,3)
  if (wideMissing.length) highlights.push(`Columns with >20% missing: ${wideMissing.map(w => w.name).join(', ')}`)
  const numericCols = profiles.filter(p => p.type === 'numeric' && p.stats)
  if (numericCols.length) {
    const widest = [...numericCols].sort((a,b) => ((b.stats!.max! - b.stats!.min!) - (a.stats!.max! - a.stats!.min!)))[0]
    if (widest) highlights.push(`Widest numeric range: ${widest.name} (${widest.stats!.min}–${widest.stats!.max})`)
  }

  return {
    rowCount,
    columnCount: profiles.length,
    columns: profiles,
    highlights
  }
}


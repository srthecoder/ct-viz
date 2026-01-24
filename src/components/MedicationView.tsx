import React, { useMemo } from 'react'
import { Pill, Calendar, CheckCircle2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface MedicationViewProps {
  rawData: any[]
}

const MedicationView: React.FC<MedicationViewProps> = ({ rawData }) => {
  // Medication-related columns
  const medicationColumns = [
    'medication', 'medicationName', 'drug', 'prescription',
    'dosage', 'dose', 'frequency', 'schedule',
    'administered', 'compliance', 'adherence'
  ]

  // Find medication data in the dataset
  const medicationData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    const firstRow = rawData[0]
    const hasMedicationData = medicationColumns.some(col => 
      Object.keys(firstRow).some(key => 
        key.toLowerCase().includes(col.toLowerCase())
      )
    )

    if (!hasMedicationData) return []

    // Try to extract medication information
    return rawData.map(row => {
      const medication = row['medication'] || row['medicationName'] || row['drug'] || row['prescription'] || 'Unknown'
      const dosage = row['dosage'] || row['dose'] || 'N/A'
      const frequency = row['frequency'] || row['schedule'] || 'N/A'
      const administered = row['administered'] || row['compliance'] || row['adherence']
      const date = row['enrollmentDate'] || row['enrollment_date'] || row['date'] || row['visitDate'] || row['visit_date']
      const patientId = row['patientId'] || row['patient_id'] || row['id']

      return {
        medication: String(medication),
        dosage: String(dosage),
        frequency: String(frequency),
        administered: administered !== null && administered !== undefined ? String(administered).toLowerCase() : 'unknown',
        date: date ? date.split('T')[0] : null,
        patientId: String(patientId)
      }
    }).filter(item => item.medication !== 'Unknown' || item.administered !== 'unknown')
  }, [rawData])

  // Medication distribution
  const medicationDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}
    medicationData.forEach(item => {
      distribution[item.medication] = (distribution[item.medication] || 0) + 1
    })
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [medicationData])

  // Compliance/Administration status
  const complianceData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      'Administered': 0,
      'Missed': 0,
      'Unknown': 0
    }

    medicationData.forEach(item => {
      const status = item.administered
      if (status === 'yes' || status === 'true' || status === '1' || status === 'administered') {
        statusCounts['Administered']++
      } else if (status === 'no' || status === 'false' || status === '0' || status === 'missed') {
        statusCounts['Missed']++
      } else {
        statusCounts['Unknown']++
      }
    })

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))
  }, [medicationData])

  // Medication timeline
  const medicationTimeline = useMemo(() => {
    const timeline: Record<string, number> = {}
    medicationData.forEach(item => {
      if (item.date) {
        const month = item.date.substring(0, 7) // YYYY-MM
        timeline[month] = (timeline[month] || 0) + 1
      }
    })
    return Object.entries(timeline)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date: date.split('-').reverse().join('/'), // MM/YYYY format
        count
      }))
  }, [medicationData])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (medicationData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
        <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No medication data available in the current dataset.</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload data with columns like: medication, dosage, frequency, administered, compliance
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="h-6 w-6 text-blue-600" />
          Medication Administration Records
        </h3>
        <div className="text-sm text-gray-600">
          {medicationData.length} records
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Medications</p>
              <p className="text-2xl font-bold text-gray-900">{medicationData.length}</p>
            </div>
            <Pill className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Medications</p>
              <p className="text-2xl font-bold text-gray-900">{medicationDistribution.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administered</p>
              <p className="text-2xl font-bold text-gray-900">
                {complianceData.find(c => c.name === 'Administered')?.value || 0}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication Distribution */}
        {medicationDistribution.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Top Medications</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={medicationDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Compliance Status */}
        {complianceData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Administration Status</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complianceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Medication Timeline */}
      {medicationTimeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Medication Administration Timeline</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={medicationTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default MedicationView

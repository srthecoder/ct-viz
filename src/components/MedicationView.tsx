import React, { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Pill, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface MedicationViewProps {
  rawData: any[]
}

const MedicationView: React.FC<MedicationViewProps> = ({ rawData }) => {
  const [selectedPatient, setSelectedPatient] = useState<string>('all')

  // Get unique patients
  const patients = useMemo(() => {
    if (!rawData) return []
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const patientSet = new Set<string>()
    
    rawData.forEach(row => {
      const normalizedRow: Record<string, any> = {}
      Object.keys(row).forEach(key => {
        normalizedRow[normalizeKey(key)] = row[key]
      })
      const patientId = normalizedRow['patientid'] || normalizedRow['patient_id'] || normalizedRow['id']
      if (patientId) patientSet.add(String(patientId))
    })
    
    return Array.from(patientSet).sort()
  }, [rawData])

  // Extract medication data
  const medicationData = useMemo(() => {
    if (!rawData) return []
    
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const medications: Array<{
      patientId: string
      medication: string
      dosage: string
      frequency: string
      date: string
      administered: boolean
    }> = []
    
    rawData.forEach(row => {
      const normalizedRow: Record<string, any> = {}
      Object.keys(row).forEach(key => {
        normalizedRow[normalizeKey(key)] = row[key]
      })
      
      const patientId = normalizedRow['patientid'] || normalizedRow['patient_id'] || normalizedRow['id']
      const medication = normalizedRow['medication'] || normalizedRow['medicationname'] || normalizedRow['drug']
      const dosage = normalizedRow['dosage'] || normalizedRow['dose']
      const frequency = normalizedRow['frequency'] || normalizedRow['schedule']
      const date = normalizedRow['date'] || normalizedRow['visitdate'] || normalizedRow['enrollmentdate']
      const administered = normalizedRow['administered'] !== undefined 
        ? Boolean(normalizedRow['administered']) 
        : normalizedRow['status']?.toLowerCase().includes('administered') || true
      
      if (patientId && medication) {
        medications.push({
          patientId: String(patientId),
          medication: String(medication),
          dosage: dosage ? String(dosage) : 'N/A',
          frequency: frequency ? String(frequency) : 'N/A',
          date: date ? String(date).split('T')[0] : 'Unknown',
          administered
        })
      }
    })
    
    return medications
  }, [rawData])

  // Filter by selected patient
  const filteredMedications = useMemo(() => {
    if (selectedPatient === 'all') return medicationData
    return medicationData.filter(m => m.patientId === selectedPatient)
  }, [medicationData, selectedPatient])

  // Medication frequency analysis
  const medicationFrequency = useMemo(() => {
    const frequencyMap = new Map<string, number>()
    filteredMedications.forEach(m => {
      const count = frequencyMap.get(m.medication) || 0
      frequencyMap.set(m.medication, count + 1)
    })
    
    return Array.from(frequencyMap.entries())
      .map(([medication, count]) => ({ medication, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [filteredMedications])

  // Compliance tracking
  const complianceData = useMemo(() => {
    const patientCompliance = new Map<string, { total: number; administered: number }>()
    
    filteredMedications.forEach(m => {
      const current = patientCompliance.get(m.patientId) || { total: 0, administered: 0 }
      current.total++
      if (m.administered) current.administered++
      patientCompliance.set(m.patientId, current)
    })
    
    return Array.from(patientCompliance.entries())
      .map(([patientId, data]) => ({
        patientId,
        complianceRate: data.total > 0 ? (data.administered / data.total) * 100 : 0,
        total: data.total,
        administered: data.administered
      }))
      .sort((a, b) => a.complianceRate - b.complianceRate)
  }, [filteredMedications])

  // Timeline data
  const timelineData = useMemo(() => {
    const dateMap = new Map<string, number>()
    filteredMedications.forEach(m => {
      const count = dateMap.get(m.date) || 0
      dateMap.set(m.date, count + 1)
    })
    
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredMedications])

  // Overall statistics
  const stats = useMemo(() => {
    const total = filteredMedications.length
    const administered = filteredMedications.filter(m => m.administered).length
    const uniqueMedications = new Set(filteredMedications.map(m => m.medication)).size
    const complianceRate = total > 0 ? (administered / total) * 100 : 0
    
    return {
      total,
      administered,
      missed: total - administered,
      uniqueMedications,
      complianceRate
    }
  }, [filteredMedications])

  if (medicationData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No medication data found in the uploaded dataset.</p>
        <p className="text-sm text-gray-500 mt-2">
          Include columns like medication, medicationName, dosage, frequency, administered, etc.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="h-6 w-6 text-blue-600" />
            Medication Administration
          </h2>
          <p className="text-gray-600 mt-1">Track medication records and compliance</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Patients</option>
              {patients.map(patient => (
                <option key={patient} value={patient}>{patient}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Administrations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Pill className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administered</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.administered}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Missed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.missed}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.complianceRate.toFixed(1)}%</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Medication Frequency Chart */}
      {medicationFrequency.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Prescribed Medications</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={medicationFrequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="medication" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Compliance Chart */}
      {complianceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Compliance Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="patientId" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Bar dataKey="complianceRate" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      {timelineData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Administration Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Medication Records Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medication Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.slice(0, 50).map((med, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{med.patientId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{med.medication}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{med.dosage}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{med.frequency}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{med.date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      med.administered 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {med.administered ? 'Administered' : 'Missed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMedications.length > 50 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Showing first 50 of {filteredMedications.length} records
          </p>
        )}
      </div>
    </div>
  )
}

export default MedicationView

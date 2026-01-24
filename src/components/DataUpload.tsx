import React, { useRef, useState } from 'react'
import { Upload, FileText, X, Sparkles } from 'lucide-react'
import { parseCSV, processClinicalData } from '../utils/dataCleaning'
import { useData } from '../context/DataContext'
import MappingWizard from './MappingWizard'
import { ColumnMappingState } from '../types'

const DataUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rawPreview, setRawPreview] = useState<any[] | null>(null)
  const [showMapping, setShowMapping] = useState(false)
  const { loadData } = useData()

  const handleFile = async (file: File) => {
    setIsProcessing(true)
    setUploadedFileName(file.name)

    try {
      const rawData = await parseCSV(file)
      setRawPreview(rawData)
      setShowMapping(true)
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please check the format and try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv' || file?.name.endsWith('.csv')) {
      handleFile(file)
    } else {
      alert('Please upload a CSV file')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      handleFile(file)
    } else {
      alert('Please upload a CSV file')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClear = () => {
    setUploadedFileName(null)
    setRawPreview(null)
    setShowMapping(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUseSampleData = async () => {
    setIsProcessing(true)
    try {
      // Load the comprehensive veterinary data CSV file
      // Try both paths (with and without base path)
      let response = await fetch('/vet-comprehensive-data.csv')
      if (!response.ok) {
        response = await fetch('/ct-viz/vet-comprehensive-data.csv')
      }
      if (!response.ok) {
        throw new Error('Could not load sample data file')
      }
      const csvText = await response.text()
      const file = new File([csvText], 'vet-comprehensive-data.csv', { type: 'text/csv' })
      // Use handleFile which will trigger the mapping wizard
      await handleFile(file)
    } catch (error) {
      console.error('Error loading sample data:', error)
      alert('Could not load sample data. Please upload a CSV file instead.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingConfirm = (normalizedRows: any[], _mappings: ColumnMappingState[]) => {
    setIsProcessing(true)
    try {
      const clinicalData = processClinicalData(normalizedRows)
      loadData(clinicalData, normalizedRows)
      setShowMapping(false)
      setRawPreview(null)
    } catch (error) {
      console.error('Error applying mappings:', error)
      alert('Could not apply column mappings. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingCancel = () => {
    setShowMapping(false)
    setRawPreview(null)
    setUploadedFileName(null)
  }

  return (
    <div className="mb-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        
        {uploadedFileName ? (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{uploadedFileName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isProcessing ? 'Processing...' : 'File uploaded successfully'}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-sm text-gray-600 text-center">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Click to upload
                </span>
                {' '}or drag and drop
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">CSV files only</p>
            </label>
            <button
              type="button"
              onClick={handleUseSampleData}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Use sample data
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Expected CSV Format</h3>
        <p className="text-xs text-blue-700 mb-2">
          Your CSV should include columns such as: patientId, siteId, age, gender, species, enrollmentDate, status, treatment
        </p>
        <p className="text-xs text-blue-700 mb-2">
          <strong>Veterinary-specific:</strong> Include columns for:
        </p>
        <ul className="text-xs text-blue-700 mb-2 list-disc list-inside">
          <li>Blood reports: WBC, RBC, Hemoglobin, Hematocrit, Platelets, Glucose, BUN, Creatinine, ALT, AST</li>
          <li>X-ray scans: XRayScore, XRayFindings</li>
          <li>Medications: medication, medicationName, dosage, frequency, administered</li>
          <li>Billing: amount, cost, payment, balance, paymentStatus</li>
        </ul>
        <p className="text-xs text-blue-600">
          Try the <span className="font-semibold">sample data</span> button for a complete example with all features.
        </p>
        <p className="text-xs text-blue-600">
          Column names are case-insensitive and will be automatically normalized
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Tip: Use the <span className="font-semibold">sample data</span> button to preview the dashboard without a CSV.
        </p>
      </div>

      {showMapping && rawPreview && (
        <div className="mt-6">
          <MappingWizard
            rawData={rawPreview}
            onConfirm={handleMappingConfirm}
            onCancel={handleMappingCancel}
          />
        </div>
      )}
    </div>
  )
}

export default DataUpload


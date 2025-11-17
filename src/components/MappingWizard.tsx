import React, { useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Wand2, X, Edit3 } from 'lucide-react'
import { ColumnMappingState, TrialConceptDefinition, TrialConceptId } from '../types'
import { TRIAL_CONCEPTS, initializeColumnMappings, applyMappingsToRows } from '../utils/mapping'

interface MappingWizardProps {
  rawData: any[]
  onConfirm: (normalizedRows: any[], mappings: ColumnMappingState[]) => void
  onCancel: () => void
}

const REQUIRED_CONCEPT_IDS: TrialConceptId[] = [
  'subjectId',
  'siteId',
  'treatment',
  'status',
  'enrollmentDate'
]

const MappingWizard: React.FC<MappingWizardProps> = ({ rawData, onConfirm, onCancel }) => {
  const columns = useMemo(() => {
    if (!rawData || rawData.length === 0) return []
    return Object.keys(rawData[0] || {})
  }, [rawData])

  const [mappings, setMappings] = useState<ColumnMappingState[]>(() =>
    initializeColumnMappings(columns)
  )

  const missingConcepts = useMemo(() => {
    const missingIds = REQUIRED_CONCEPT_IDS.filter(
      (conceptId) => !mappings.some((mapping) => mapping.concept === conceptId)
    )
    return missingIds
      .map((id) => TRIAL_CONCEPTS.find((concept) => concept.id === id))
      .filter((concept): concept is TrialConceptDefinition => Boolean(concept))
  }, [mappings])
  const canProceed = missingConcepts.length === 0

  const requiredConceptOptions = useMemo(
    () => TRIAL_CONCEPTS.filter((concept) => REQUIRED_CONCEPT_IDS.includes(concept.id)),
    []
  )
  const optionalConceptOptions = useMemo(
    () => TRIAL_CONCEPTS.filter((concept) => !REQUIRED_CONCEPT_IDS.includes(concept.id) && concept.id !== 'ignore'),
    []
  )
  const ignoreConcept = TRIAL_CONCEPTS.find((concept) => concept.id === 'ignore')

  const handleConceptChange = (columnName: string, conceptId?: string) => {
    setMappings((prev) =>
      prev.map((mapping) =>
        mapping.columnName === columnName
          ? {
              ...mapping,
              concept: conceptId ? (conceptId as ColumnMappingState['concept']) : undefined,
              autoMatched: false
            }
          : mapping
      )
    )
  }

  const handleColumnRename = (columnName: string, value: string) => {
    setMappings((prev) =>
      prev.map((mapping) =>
        mapping.columnName === columnName
          ? {
              ...mapping,
              displayName: value || mapping.columnName
            }
          : mapping
      )
    )
  }

  const handleConfirm = () => {
    if (!canProceed) return
    const normalizedRows = applyMappingsToRows(rawData, mappings)
    onConfirm(normalizedRows, mappings)
  }

  const renderConceptOption = (concept: TrialConceptDefinition) => (
    <option key={concept.id} value={concept.id}>
      {concept.label} {concept.required ? '(Required)' : ''}
    </option>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold">Step 2</p>
          <h3 className="text-lg font-semibold text-gray-900">Map CSV Columns to Trial Concepts</h3>
          <p className="text-sm text-gray-500">
            Review the auto-suggestions and fix any ambiguous mappings before continuing.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 rounded-full p-2 transition-colors"
          aria-label="Close mapping wizard"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {missingConcepts.length > 0 ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-semibold">Map the remaining required concepts before continuing:</p>
                <ul className="list-disc list-inside">
                  {missingConcepts.map((concept) => (
                    <li key={concept.id}>{concept.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" />
            <span>All required concepts are mapped. Optional columns can stay unmapped or set to “Other / Ignore”.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">CSV Column</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Trial Concept</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mappings.map((mapping) => {
                const conceptDefinition = TRIAL_CONCEPTS.find((concept) => concept.id === mapping.concept)

                return (
                  <tr key={mapping.columnName} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                        Column Label
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={mapping.displayName}
                          onChange={(event) => handleColumnRename(mapping.columnName, event.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter column name"
                          spellCheck={false}
                        />
                        <Edit3 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Original header: <span className="font-medium">{mapping.columnName || 'Unnamed column'}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={`block w-full rounded-md border ${
                          !mapping.concept
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : 'border-gray-300'
                        } px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        value={mapping.concept || ''}
                        onChange={(event) => handleConceptChange(mapping.columnName, event.target.value || undefined)}
                      >
                        <option value="">Select concept</option>
                        {requiredConceptOptions.length > 0 && (
                          <optgroup label="Required">
                            {requiredConceptOptions.map(renderConceptOption)}
                          </optgroup>
                        )}
                        {optionalConceptOptions.length > 0 && (
                          <optgroup label="Optional">
                            {optionalConceptOptions.map(renderConceptOption)}
                          </optgroup>
                        )}
                        {ignoreConcept && (
                          <option value={ignoreConcept.id}>{ignoreConcept.label}</option>
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {mapping.concept ? (
                        <div className="flex items-center space-x-2">
                          {mapping.concept === 'ignore' ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                              Ignored
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {conceptDefinition?.label}
                            </span>
                          )}
                          {mapping.autoMatched && (
                            <span
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-blue-600"
                              title="Auto-suggested based on header similarity"
                            >
                              <Wand2 className="mr-1 h-3 w-3" />
                              Auto-matched ({mapping.confidence})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Needs selection
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canProceed}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              canProceed
                ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                : 'cursor-not-allowed bg-gray-300'
            }`}
          >
            {canProceed ? 'Review & Load Data' : 'Complete required mappings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MappingWizard


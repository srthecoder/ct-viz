import React, { useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { ColumnMappingState, TrialConceptDefinition, TrialConceptId } from '../types'
import { TRIAL_CONCEPTS, initializeColumnMappings, applyMappingsToRows, getUnmappedRequiredColumns } from '../utils/mapping'

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
  const [editingColumn, setEditingColumn] = useState<string | null>(null)

  const missingConcepts = useMemo(() => {
    const missingIds = REQUIRED_CONCEPT_IDS.filter(
      (conceptId) => !mappings.some((mapping) => mapping.concept === conceptId && mapping.concept !== 'ignore')
    )
    return missingIds
      .map((id) => TRIAL_CONCEPTS.find((concept) => concept.id === id))
      .filter((concept): concept is TrialConceptDefinition => Boolean(concept))
  }, [mappings])
  
  const unmappedColumns = useMemo(() => {
    return getUnmappedRequiredColumns(mappings, REQUIRED_CONCEPT_IDS)
  }, [mappings])
  
  const canProceed = useMemo(() => {
    const allRequiredMapped = REQUIRED_CONCEPT_IDS.every(
      (conceptId) => mappings.some((mapping) => mapping.concept === conceptId && mapping.concept !== 'ignore')
    )
    return allRequiredMapped
  }, [mappings])

  const requiredConceptOptions = useMemo(
    () => TRIAL_CONCEPTS.filter((concept) => REQUIRED_CONCEPT_IDS.includes(concept.id)),
    []
  )
  const optionalConceptOptions = useMemo(
    () => TRIAL_CONCEPTS.filter((concept) => !REQUIRED_CONCEPT_IDS.includes(concept.id) && concept.id !== 'ignore' && concept.id !== 'dropout'),
    []
  )

  const handleConceptChange = (columnName: string, conceptId?: string) => {
    setMappings((prev) => {
      const updated = prev.map((mapping) =>
        mapping.columnName === columnName
          ? {
              ...mapping,
              concept: conceptId ? (conceptId as ColumnMappingState['concept']) : 'ignore',
              autoMatched: false
            }
          : mapping
      )
      return updated
    })
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

  const handleColumnRenameFocus = (columnName: string) => {
    setEditingColumn(columnName)
  }

  const handleColumnRenameBlur = () => {
    setEditingColumn(null)
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
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold mb-2">Map the remaining required concepts before continuing:</p>
                <ul className="list-disc list-inside space-y-1">
                  {missingConcepts.map((concept) => {
                    const unmappedColumn = unmappedColumns.find((uc) => uc.requiredConcept === concept.label)
                    return (
                      <li key={concept.id}>
                        <span className="font-medium">{concept.label}</span>
                        {unmappedColumn && (
                          <span className="text-amber-700 ml-2">
                            (suggest mapping column "{unmappedColumn.displayName}" to {concept.label})
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span>All required concepts are mapped. Optional columns can stay unmapped or set to "Other / Ignore".</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Column Name & Concept</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mappings.map((mapping) => {
                return (
                  <tr key={mapping.columnName} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={mapping.displayName}
                              onChange={(event) => handleColumnRename(mapping.columnName, event.target.value)}
                              onFocus={() => handleColumnRenameFocus(mapping.columnName)}
                              onBlur={handleColumnRenameBlur}
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter column name"
                              spellCheck={false}
                            />
                          </div>
                          <div className="w-64">
                            <select
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={mapping.concept || 'ignore'}
                              onChange={(event) => handleConceptChange(mapping.columnName, event.target.value === 'ignore' ? undefined : event.target.value)}
                            >
                              <option value="ignore">Other / Ignore</option>
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
                            </select>
                          </div>
                        </div>
                        {editingColumn !== mapping.columnName && (
                          <p className="text-xs text-gray-500">
                            Original: <span className="font-medium">{mapping.columnName || 'Unnamed column'}</span>
                          </p>
                        )}
                      </div>
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


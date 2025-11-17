import { ColumnMappingState, TrialConceptDefinition, TrialConceptId } from '../types'

export const TRIAL_CONCEPTS: TrialConceptDefinition[] = [
  {
    id: 'subjectId',
    label: 'Subject ID',
    description: 'Unique identifier for each patient/participant',
    required: true,
    keywords: ['patientid', 'subjectid', 'participantid', 'patient_id', 'subject', 'id']
  },
  {
    id: 'siteId',
    label: 'Site ID',
    description: 'Identifier of the site enrolling the subject',
    required: true,
    keywords: ['siteid', 'site_id', 'site', 'location']
  },
  {
    id: 'visitId',
    label: 'Visit',
    description: 'Visit label, visit number, or visit date',
    required: false,
    keywords: ['visit', 'visitnumber', 'visit_id']
  },
  {
    id: 'treatment',
    label: 'Treatment / Arm',
    description: 'Treatment group or study arm',
    required: true,
    keywords: ['treatment', 'arm', 'group', 'therapy']
  },
  {
    id: 'status',
    label: 'Status',
    description: 'Enrollment or patient status',
    required: true,
    keywords: ['status', 'patientstatus', 'enrollmentstatus', 'state']
  },
  {
    id: 'outcome',
    label: 'Outcome',
    description: 'Response or outcome flag',
    required: false,
    keywords: ['outcome', 'response', 'result']
  },
  {
    id: 'enrollmentDate',
    label: 'Enrollment Date',
    description: 'Date subject enrolled or visit occurred',
    required: true,
    keywords: ['enrollmentdate', 'enrollment_date', 'date', 'visitdate', 'randomizationdate']
  },
  {
    id: 'ignore',
    label: 'Other / Ignore',
    description: 'Column will not be used in downstream dashboards',
    required: false,
    keywords: []
  }
]

const normalize = (value: string) => value?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''

export const initializeColumnMappings = (columns: string[]): ColumnMappingState[] => {
  return columns.map((column) => {
    const normalized = normalize(column)
    const suggestedConcept = TRIAL_CONCEPTS.find((concept) =>
      concept.keywords.some((keyword) => normalized === keyword || normalized.includes(keyword))
    )

    let confidence: ColumnMappingState['confidence'] = 'low'
    if (suggestedConcept) {
      confidence = normalized === suggestedConcept.keywords[0] ? 'high' : 'medium'
    }

    return {
      columnName: column,
      displayName: column,
      concept: suggestedConcept?.id,
      confidence,
      autoMatched: Boolean(suggestedConcept)
    }
  })
}

export const getMissingRequiredConcepts = (mappings: ColumnMappingState[]) => {
  return TRIAL_CONCEPTS.filter((concept) => concept.required && !mappings.some((m) => m.concept === concept.id))
}

export const applyMappingsToRows = (
  rawRows: any[],
  mappings: ColumnMappingState[]
): Array<Record<string, any>> => {
  const conceptByColumn = new Map<string, TrialConceptId>()
  const aliasByColumn = new Map<string, string>()
  mappings.forEach((mapping) => {
    if (mapping.concept && mapping.concept !== 'ignore') {
      conceptByColumn.set(mapping.columnName, mapping.concept)
    }
    if (
      mapping.displayName &&
      mapping.displayName.trim() &&
      mapping.displayName.trim() !== mapping.columnName
    ) {
      aliasByColumn.set(mapping.columnName, mapping.displayName.trim())
    }
  })

  const conceptToCanonicalField: Record<TrialConceptId, string> = {
    subjectId: 'patientId',
    siteId: 'siteId',
    visitId: 'visit',
    treatment: 'treatment',
    status: 'status',
    outcome: 'outcome',
    enrollmentDate: 'enrollmentDate',
    ignore: ''
  }

  return rawRows.map((row) => {
    const normalizedRow: Record<string, any> = {}

    Object.entries(row ?? {}).forEach(([key, value]) => {
      const alias = aliasByColumn.get(key)
      const displayKey = alias || key || 'Column'
      normalizedRow[displayKey] = value

      const concept = conceptByColumn.get(key)
      if (!concept) return
      const canonicalField = conceptToCanonicalField[concept]
      if (canonicalField) {
        normalizedRow[canonicalField] = value
      }
    })

    return normalizedRow
  })
}


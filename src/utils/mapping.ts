import { ColumnMappingState, TrialConceptDefinition, TrialConceptId } from '../types'

export const TRIAL_CONCEPTS: TrialConceptDefinition[] = [
  {
    id: 'subjectId',
    label: 'Subject ID',
    description: 'Unique identifier for each patient/participant',
    required: true,
    keywords: ['patientid', 'subjectid', 'participantid', 'patient_id', 'subject_id', 'participant_id']
  },
  {
    id: 'siteId',
    label: 'Site ID',
    description: 'Identifier of the site enrolling the subject',
    required: true,
    keywords: ['siteid', 'site_id', 'site', 'location', 'centre', 'center', 'facility', 'clinic', 'institution']
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
    id: 'age',
    label: 'Age',
    description: 'Patient age or age bucket',
    required: false,
    keywords: ['age', 'patientage']
  },
  {
    id: 'gender',
    label: 'Gender / Sex',
    description: 'Patient gender or sex',
    required: false,
    keywords: ['gender', 'sex']
  },
  {
    id: 'outcome',
    label: 'Outcome',
    description: 'Response or outcome flag',
    required: false,
    keywords: ['outcome', 'response', 'result']
  },
  {
    id: 'dropout',
    label: 'Dropout Flag',
    description: 'Indicates whether a patient dropped out',
    required: false,
    keywords: ['dropout', 'discontinue', 'withdrawn']
  },
  {
    id: 'adverseEvent',
    label: 'Adverse Event',
    description: 'Flag or description for adverse events',
    required: false,
    keywords: ['adverseevent', 'ae', 'seriousadverseevent']
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
    
    // Find best match with priority: exact match > starts with > contains
    // IMPORTANT: Check siteId BEFORE subjectId to avoid false matches
    let bestMatch: { concept: TrialConceptDefinition; confidence: 'high' | 'medium' | 'low' } | null = null
    let exactMatch: { concept: TrialConceptDefinition } | null = null
    
    // Sort concepts to prioritize siteId over subjectId
    const sortedConcepts = [...TRIAL_CONCEPTS].sort((a, b) => {
      if (a.id === 'siteId') return -1
      if (b.id === 'siteId') return 1
      if (a.id === 'subjectId') return 1
      if (b.id === 'subjectId') return -1
      return 0
    })
    
    // First pass: look for exact matches (highest priority)
    for (const concept of sortedConcepts) {
      for (const keyword of concept.keywords) {
        const normalizedKeyword = normalize(keyword)
        if (normalized === normalizedKeyword) {
          exactMatch = { concept }
          break
        }
      }
      if (exactMatch) break
    }
    
    if (exactMatch) {
      bestMatch = { concept: exactMatch.concept, confidence: 'high' }
    } else {
      // Second pass: look for starts-with matches (medium priority)
      for (const concept of sortedConcepts) {
        for (const keyword of concept.keywords) {
          const normalizedKeyword = normalize(keyword)
          // Require at least 3 chars and prioritize siteId keywords
          if (normalizedKeyword.length >= 3 && normalized.startsWith(normalizedKeyword)) {
            bestMatch = { concept, confidence: 'medium' }
            break
          }
        }
        if (bestMatch) break
      }
      
      // Third pass: look for contains matches (low priority, but avoid very short keywords)
      if (!bestMatch) {
        for (const concept of sortedConcepts) {
          for (const keyword of concept.keywords) {
            const normalizedKeyword = normalize(keyword)
            // Only match if keyword is substantial (>= 4 chars) to avoid false matches
            // Special case: don't match "id" alone in subjectId keywords
            if (normalizedKeyword.length >= 4 && normalized.includes(normalizedKeyword)) {
              bestMatch = { concept, confidence: 'low' }
              break
            }
          }
          if (bestMatch) break
        }
      }
    }

    // Default optional columns to "ignore" if no match found
    const defaultConcept = bestMatch?.concept.id || 'ignore'
    const isRequired = bestMatch?.concept.required || false

    return {
      columnName: column,
      displayName: column,
      concept: isRequired ? bestMatch?.concept.id : defaultConcept,
      confidence: bestMatch?.confidence || 'low',
      autoMatched: Boolean(bestMatch)
    }
  })
}

export const getMissingRequiredConcepts = (mappings: ColumnMappingState[]) => {
  return TRIAL_CONCEPTS.filter((concept) => concept.required && !mappings.some((m) => m.concept === concept.id))
}

export const getUnmappedRequiredColumns = (mappings: ColumnMappingState[], requiredConceptIds: TrialConceptId[]) => {
  const unmappedColumns: Array<{ columnName: string; displayName: string; requiredConcept: string }> = []
  
  requiredConceptIds.forEach((conceptId) => {
    const concept = TRIAL_CONCEPTS.find((c) => c.id === conceptId)
    if (!concept) return
    
    const hasMapping = mappings.some((m) => m.concept === conceptId)
    if (!hasMapping) {
      // Find columns that could be mapped to this concept but aren't
      const potentialColumns = mappings.filter((m) => !m.concept || m.concept === 'ignore')
      if (potentialColumns.length > 0) {
        unmappedColumns.push({
          columnName: potentialColumns[0].columnName,
          displayName: potentialColumns[0].displayName,
          requiredConcept: concept.label
        })
      }
    }
  })
  
  return unmappedColumns
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
    age: 'age',
    gender: 'gender',
    outcome: 'outcome',
    dropout: 'dropout',
    adverseEvent: 'adverseEvent',
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


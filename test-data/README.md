# Test Data Files - Unclean Dataset Cases

This directory contains mock CSV files with various data quality issues to test how the UI handles incomplete, malformed, or problematic data.

## Test Files

### 1. `missing-headers.csv`
- **Issue**: No header row - data starts immediately
- **Test**: How the parser handles files without column names

### 2. `bad-column-names.csv`
- **Issue**: Column names don't match expected format (ID, Location, Age_Years, Sex, Enrolled, Current_Status, Group)
- **Test**: Column name normalization and fallback logic

### 3. `partial-data.csv`
- **Issue**: Missing values scattered throughout rows (empty cells)
- **Test**: Handling of null/empty values in various columns

### 4. `empty-rows.csv`
- **Issue**: Contains empty rows between data rows
- **Test**: Filtering of empty rows during parsing

### 5. `mixed-data-types.csv`
- **Issue**: Inconsistent data types (text in numeric fields, invalid dates, N/A values)
- **Test**: Type inference and data validation

### 6. `extra-columns.csv`
- **Issue**: Contains additional columns not in the expected schema
- **Test**: Handling of extra columns (should be ignored gracefully)

### 7. `minimal-data.csv`
- **Issue**: Only has patientId and siteId columns, missing all other fields
- **Test**: Fallback values and default assignments

### 8. `malformed-dates.csv`
- **Issue**: Dates in various formats (MM/DD/YYYY, DD-MM-YYYY, YYYY.MM.DD, text format)
- **Test**: Date parsing and normalization

### 9. `whitespace-issues.csv`
- **Issue**: Extra whitespace around values and column names
- **Test**: Trimming and whitespace handling

### 10. `duplicate-rows.csv`
- **Issue**: Contains duplicate patient records
- **Test**: Duplicate detection and handling

## Usage

Upload these files through the DataUpload component to test error handling, data cleaning, and UI resilience. The system should:
- Handle errors gracefully
- Show appropriate error messages
- Clean and normalize data where possible
- Provide insights about data quality issues


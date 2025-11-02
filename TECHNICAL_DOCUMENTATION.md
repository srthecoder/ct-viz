# CT-Viz Dashboard - Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Data Flow & State Management](#data-flow--state-management)
7. [Utilities & Helpers](#utilities--helpers)
8. [Configuration Files](#configuration-files)
9. [Development Workflow](#development-workflow)
10. [Deployment Guide](#deployment-guide)
11. [API Reference](#api-reference)

---

## Project Overview

**CT-Viz Dashboard** is a single-page application (SPA) built with React and TypeScript for visualizing clinical trial data. It provides interactive dashboards, site-specific reports, and data analysis capabilities for clinical research teams.

### Key Features

- **CSV Data Upload**: Drag-and-drop file upload with automatic data normalization
- **Interactive Dashboard**: Real-time metrics and visualizations
- **Site Reports**: Detailed per-site analysis with patient lists
- **Data Intelligence**: Automatic data cleaning and column name normalization
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

---

## Architecture

### Application Architecture Pattern

The application follows a **Component-Based Architecture** with the following layers:

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (React Components + UI Library)   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Context/State Layer            │
│    (React Context API - DataContext)│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        Business Logic Layer         │
│     (Data Processing Utilities)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│          Data Layer                  │
│      (CSV Parsing - PapaParse)      │
└─────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── DataProvider (Context)
└── Router
    └── Layout
        ├── Navigation Bar
        └── Routes
            ├── Dashboard (/)
            │   ├── DataUpload
            │   ├── MetricCards
            │   ├── Charts (Multiple)
            │   └── SitesTable
            └── SiteReport (/site/:siteId)
                ├── SiteMetrics
                ├── Charts (Site-specific)
                └── PatientsTable
```

---

## Technology Stack

### Core Framework & Runtime

- **React 18.2.0**: UI library for building component-based interfaces
- **TypeScript 5.2.2**: Type-safe JavaScript for better code quality
- **Vite 5.0.8**: Next-generation build tool and dev server

### Routing

- **React Router DOM 6.21.0**: Client-side routing for navigation

### Data Visualization

- **Recharts 2.10.3**: React charting library built on D3.js
  - Used for: Pie charts, Bar charts, Line charts

### Data Processing

- **PapaParse 5.4.1**: Fast CSV parser for JavaScript
  - Handles CSV file parsing and data extraction

### UI/UX

- **Tailwind CSS 3.3.6**: Utility-first CSS framework
- **Lucide React 0.303.0**: Icon library
- **date-fns 3.0.6**: Date utility library (imported but not extensively used)

### Development Tools

- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

---

## Project Structure

```
ct-viz-dashboard/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx                # Root component with routing
│   ├── index.css              # Global styles
│   ├── components/            # React components
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Dashboard.tsx      # Main dashboard view
│   │   ├── DataUpload.tsx     # File upload component
│   │   └── SiteReport.tsx     # Site-specific report view
│   ├── context/               # React Context providers
│   │   └── DataContext.tsx    # Global data state management
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # All type interfaces
│   └── utils/                 # Utility functions
│       └── dataCleaning.ts    # Data processing utilities
├── dist/                      # Production build output
├── node_modules/              # Dependencies
├── index.html                 # HTML entry point
├── package.json               # Project dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── sample-data.csv            # Example CSV data file
```

---

## Core Components

### 1. App.tsx

**Purpose**: Root component that sets up routing and global context.

**Key Responsibilities**:
- Wraps the application with `DataProvider` for global state
- Configures React Router with routes
- Provides `Layout` wrapper for consistent page structure

**Routes**:
- `/` → Dashboard component
- `/site/:siteId` → SiteReport component (dynamic route)

**Code Breakdown**:
```typescript
// DataProvider provides clinicalData and metrics globally
<DataProvider>
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/site/:siteId" element={<SiteReport />} />
      </Routes>
    </Layout>
  </Router>
</DataProvider>
```

---

### 2. Layout.tsx

**Purpose**: Provides consistent page layout with navigation.

**Features**:
- Fixed navigation bar at the top
- Logo and branding (CT-Viz)
- Navigation links (Dashboard)
- Displays data summary when data is loaded
- Responsive design

**Component Props**:
- `children`: ReactNode - Content to render inside layout

**Key Elements**:
- **Navigation Bar**: White background with shadow, contains logo and links
- **Main Content Area**: Max-width container with padding for responsive design
- **Data Summary**: Shows patient and site count when data is available

---

### 3. DataUpload.tsx

**Purpose**: Handles CSV file upload with drag-and-drop functionality.

**Key Features**:
- Drag-and-drop file upload
- Click-to-upload alternative
- File validation (CSV only)
- Processing state indication
- Uploaded file display with clear option
- Helpful format hints

**State Management**:
- `isDragging`: Boolean - Tracks drag state for visual feedback
- `uploadedFileName`: String | null - Stores uploaded file name
- `isProcessing`: Boolean - Indicates file processing status

**Event Handlers**:
1. **handleFileChange**: Handles file input change event
2. **handleDrop**: Processes dropped files
3. **handleDragOver**: Prevents default and sets dragging state
4. **handleDragLeave**: Resets dragging state
5. **handleClear**: Clears uploaded file
6. **handleFile**: Main processing function that:
   - Parses CSV using `parseCSV` utility
   - Processes data using `processClinicalData`
   - Loads data into context via `loadData`

**User Flow**:
1. User drops or selects CSV file
2. File is validated (must be .csv)
3. File is parsed using PapaParse
4. Raw data is cleaned and normalized
5. Clinical data structure is created
6. Data is loaded into global context
7. UI updates to show uploaded file

---

### 4. Dashboard.tsx

**Purpose**: Main dashboard showing overview metrics and charts.

**Features**:
- **5 Metric Cards**: Total Patients, Total Sites, Active Sites, Enrollment Rate, Completion Rate
- **4 Charts**:
  - Patient Status Distribution (Pie Chart)
  - Gender Distribution (Pie Chart)
  - Age Distribution (Bar Chart)
  - Top Sites by Enrollment (Horizontal Bar Chart)
- **Sites Table**: List of all sites with performance metrics and navigation links
- **Data Upload**: Accessible from dashboard header

**State Dependencies**:
- Uses `useData()` hook to access `clinicalData` and `metrics`
- Uses `useNavigate()` for programmatic navigation

**Data Processing**:
1. **Status Breakdown**: Groups patients by status, calculates completion rate
2. **Site Performance**: Sorts sites by enrollment, limits to top 10
3. **Gender Distribution**: Counts patients by gender
4. **Age Distribution**: Groups patients into age brackets (<18, 18-29, 30-39, 40-49, 50-59, 60-69, 70+)

**Chart Configuration**:
- Uses Recharts library for all visualizations
- ResponsiveContainer ensures charts scale with viewport
- Custom color palette: `['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']`
- Tooltips enabled for interactivity

**Empty State**:
- Shows welcome message when no data is loaded
- Displays DataUpload component for initial data upload

**Navigation**:
- Clicking "View Report" on a site row navigates to `/site/:siteId`

---

### 5. SiteReport.tsx

**Purpose**: Displays detailed analysis for a specific clinical trial site.

**Route**: `/site/:siteId` (dynamic route parameter)

**Features**:
- **4 Metric Cards**: Total Patients, Completion Rate, Completed, Active
- **5 Charts**:
  - Patient Status (Pie Chart)
  - Gender Distribution (Pie Chart)
  - Age Distribution (Bar Chart)
  - Treatment Distribution (Bar Chart)
  - Enrollment Timeline (Line Chart - if data available)
- **Patients Table**: Complete list of all patients at the site

**Data Processing**:
1. Filters patients by `siteId` from URL parameter
2. Finds corresponding site from sites array
3. Calculates site-specific metrics:
   - Status breakdown
   - Completion rate calculation
   - Gender distribution
   - Age grouping
   - Treatment distribution
   - Enrollment timeline (grouped by date)

**Error Handling**:
- Shows error message if site not found
- Shows error if no patients for site
- Provides navigation back to dashboard

**Timeline Data**:
- Groups enrollments by date
- Sorts chronologically
- Formats dates as MM/DD for display

**Patient Table**:
- Displays: Patient ID, Age, Gender, Enrollment Date, Status (with color coding), Treatment
- Status badges:
  - Green: Completed/Complete
  - Blue: Active
  - Gray: Other statuses

---

## Data Flow & State Management

### State Management Architecture

The application uses **React Context API** for global state management, avoiding the need for external state libraries.

### DataContext.tsx

**Purpose**: Centralized state management for clinical data and metrics.

**Context Interface**:
```typescript
interface DataContextType {
  clinicalData: ClinicalData | null      // Raw processed data
  metrics: DashboardMetrics | null        // Calculated metrics
  loadData: (data: ClinicalData) => void  // Function to load new data
  clearData: () => void                    // Function to clear data
}
```

**Provider Component**: `DataProvider`
- Wraps the entire application
- Manages two state variables: `clinicalData` and `metrics`
- Provides `loadData` function that:
  1. Sets clinical data
  2. Calculates metrics using `calculateMetrics` utility
  3. Updates metrics state

**Custom Hook**: `useData()`
- Provides access to context
- Throws error if used outside DataProvider
- Used by all components that need data access

### Data Flow Diagram

```
1. User Uploads CSV
   ↓
2. DataUpload.handleFile()
   ↓
3. parseCSV() → Raw Array
   ↓
4. processClinicalData() → ClinicalData
   ↓
5. DataContext.loadData()
   ↓
6. calculateMetrics() → DashboardMetrics
   ↓
7. Context State Updated
   ↓
8. All Components Re-render
   ↓
9. Dashboard & Layout Update UI
```

### Data Structures

#### Patient Interface
```typescript
interface Patient {
  patientId: string      // Unique patient identifier
  siteId: string         // Site where patient is enrolled
  age: number            // Patient age
  gender: string         // Single character (M/F/U)
  enrollmentDate: string // ISO date string
  status: string         // Patient status (Active, Completed, etc.)
  treatment: string      // Treatment group/arm
  visits?: Visit[]       // Optional visit data
}
```

#### Site Interface
```typescript
interface Site {
  siteId: string         // Unique site identifier
  siteName: string       // Display name (auto-generated as "Site {siteId}")
  location: string       // Site location (currently "Unknown")
  enrollmentCount: number // Number of patients enrolled
  status: string         // Site status (currently always "Active")
}
```

#### ClinicalData Interface
```typescript
interface ClinicalData {
  patients: Patient[]    // Array of all patients
  sites: Site[]          // Array of all sites
  metadata?: {            // Optional metadata
    trialName?: string
    startDate?: string
    endDate?: string
  }
}
```

#### DashboardMetrics Interface
```typescript
interface DashboardMetrics {
  totalPatients: number                          // Total patient count
  totalSites: number                             // Total site count
  activeSites: number                            // Sites with "Active" status
  enrollmentRate: number                         // Patients per month
  completionRate: number                         // Percentage (0-100)
  statusBreakdown: Record<string, number>        // Status → count mapping
  sitePerformance: Array<{                      // Per-site metrics
    siteId: string
    siteName: string
    enrollmentCount: number
    completionRate: number
  }>
}
```

---

## Utilities & Helpers

### dataCleaning.ts

This file contains all data processing and transformation logic.

#### 1. parseCSV(file: File): Promise<any[]>

**Purpose**: Parses CSV file into JavaScript array.

**Implementation**:
- Uses PapaParse library
- Configures parser with headers enabled
- Skips empty lines
- Returns Promise that resolves with parsed data array

**Usage**:
```typescript
const rawData = await parseCSV(file)
```

#### 2. cleanPatientData(rawData: any[]): Patient[]

**Purpose**: Normalizes and cleans raw CSV data into Patient objects.

**Key Features**:
- **Column Name Normalization**: Case-insensitive, space-handling
- **Flexible Column Mapping**: Supports multiple column name variations:
  - Patient ID: `patientId`, `patient_id`, `id`
  - Site ID: `siteId`, `site_id`, `site`
  - Age: `age`
  - Gender: `gender`, `sex`
  - Enrollment Date: `enrollmentDate`, `enrollment_date`, `date`
  - Status: `status`, `patientStatus`
  - Treatment: `treatment`, `treatmentGroup`, `arm`

**Normalization Logic**:
```typescript
const normalizeKey = (key: string) => 
  key.toLowerCase().trim().replace(/\s+/g, '')
```

**Data Cleaning**:
- Handles missing values with sensible defaults
- Generates unique patient IDs if missing
- Normalizes gender to single uppercase character
- Converts age to number (defaults to 0 if invalid)
- Filters out rows without patientId or siteId

**Default Values**:
- Patient ID: Random string `P{random}`
- Site ID: `'SITE-001'`
- Age: `0` (if invalid)
- Gender: `'Unknown'`
- Enrollment Date: Current date (ISO format)
- Status: `'Active'`
- Treatment: `'Control'`

#### 3. extractSites(patients: Patient[]): Site[]

**Purpose**: Extracts unique sites from patient data.

**Algorithm**:
1. Iterates through all patients
2. Creates Site object for each unique `siteId`
3. Counts enrollments per site
4. Generates site name as `"Site {siteId}"`
5. Returns array of Site objects

**Site Properties**:
- `siteName`: Auto-generated as `"Site {siteId}"`
- `location`: Currently always `"Unknown"`
- `enrollmentCount`: Calculated from patient count
- `status`: Currently always `"Active"`

#### 4. processClinicalData(rawData: any[]): ClinicalData

**Purpose**: Main data processing pipeline.

**Steps**:
1. Calls `cleanPatientData` to normalize patient data
2. Calls `extractSites` to create site objects
3. Extracts metadata:
   - `trialName`: Defaults to `'Clinical Trial'`
   - `startDate`: Earliest enrollment date from patients
4. Returns complete `ClinicalData` object

#### 5. calculateMetrics(data: ClinicalData): DashboardMetrics

**Purpose**: Calculates all dashboard metrics from clinical data.

**Calculations**:

1. **Status Breakdown**:
   - Groups patients by status
   - Creates count mapping: `Record<string, number>`

2. **Completion Rate**:
   - Counts patients with status "Completed" or "Complete"
   - Formula: `(completedCount / totalPatients) * 100`
   - Rounds to 1 decimal place

3. **Enrollment Rate** (patients per month):
   - Finds earliest and latest enrollment dates
   - Calculates time difference in days
   - Converts to months (days / 30, minimum 1 month)
   - Formula: `totalPatients / monthsDiff`
   - Rounds to 1 decimal place

4. **Site Performance**:
   - For each site:
     - Filters patients by siteId
     - Calculates site-specific completion rate
     - Returns enrollment count and completion rate

5. **Active Sites**:
   - Filters sites where `status === 'Active'`
   - Counts result

**Returns**: Complete `DashboardMetrics` object with all calculated values

---

## Configuration Files

### package.json

**Purpose**: Defines project dependencies, scripts, and metadata.

**Scripts**:
- `dev`: Starts Vite development server (port 3000, auto-open)
- `build`: TypeScript compilation + Vite production build
- `preview`: Preview production build locally
- `lint`: Runs ESLint on TypeScript files

**Dependencies Categories**:
- **Production**: React, React DOM, routing, charts, CSV parsing, icons
- **Development**: TypeScript, ESLint, build tools, CSS processors

### tsconfig.json

**Purpose**: TypeScript compiler configuration.

**Key Settings**:
- `target: "ES2020"`: Compiles to ES2020 JavaScript
- `module: "ESNext"`: Uses ES modules
- `jsx: "react-jsx"`: Uses new JSX transform (no React import needed)
- `strict: true`: Enables all strict type checking
- `noUnusedLocals/Parameters: true`: Flags unused code
- `moduleResolution: "bundler"`: Optimized for Vite bundler
- `noEmit: true`: Doesn't emit files (Vite handles this)

### vite.config.ts

**Purpose**: Vite build tool configuration.

**Settings**:
- `plugins: [react()]`: React plugin for JSX support
- `server.port: 3000`: Development server port
- `server.open: true`: Auto-opens browser on start

**Build Output**:
- Defaults to `dist/` directory
- Optimized production bundles
- Code splitting enabled

### tailwind.config.js

**Purpose**: Tailwind CSS configuration.

**Content Configuration**:
- Scans `index.html` and all `src/**/*.{js,ts,jsx,tsx}` files
- Purges unused CSS in production

**Theme Extension**:
- Custom `primary` color palette (blue shades)
- Used for branding and primary actions

**Color Scale**:
- 50 (lightest) to 900 (darkest)
- Primary 500: `#0ea5e9` (main brand color)
- Primary 600: `#0284c7` (hover states)

### postcss.config.js

**Purpose**: PostCSS processing configuration.

**Plugins**:
- `tailwindcss`: Processes Tailwind directives
- `autoprefixer`: Adds vendor prefixes automatically

### index.html

**Purpose**: HTML entry point for the application.

**Structure**:
- Root `<div id="root">` for React mounting
- References `src/main.tsx` via script tag
- Vite injects build artifacts automatically

---

## Development Workflow

### Initial Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Application**:
   - Automatically opens at `http://localhost:3000`
   - Or manually navigate to the URL

### Development Process

1. **Make Code Changes**: Edit files in `src/` directory
2. **Hot Module Replacement**: Vite automatically reloads changes
3. **Type Checking**: TypeScript validates types in real-time
4. **Linting**: Run `npm run lint` to check code quality

### Building for Production

1. **Create Production Build**:
   ```bash
   npm run build
   ```

2. **Output**: Files generated in `dist/` directory
   - Optimized JavaScript bundles
   - Minified CSS
   - Asset hashing for cache busting

3. **Preview Production Build**:
   ```bash
   npm run preview
   ```

### Code Quality

**Linting**:
```bash
npm run lint
```

**Type Checking**:
- Automatic in development mode
- TypeScript compiler validates on save
- Errors shown in IDE and terminal

---

## Deployment Guide

### Build Process

1. **Production Build**:
   ```bash
   npm run build
   ```

2. **Output Location**: `dist/` directory contains all static assets

3. **Deployment Options**:

#### Option 1: Static Hosting (Recommended)

**Vercel**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to deploy

**Netlify**:
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy --prod --dir=dist`
3. Or drag `dist/` folder to Netlify dashboard

**GitHub Pages**:
1. Install gh-pages: `npm i -D gh-pages`
2. Add script: `"deploy": "npm run build && gh-pages -d dist"`
3. Run: `npm run deploy`

#### Option 2: Traditional Web Server

**Requirements**:
- Web server (Nginx, Apache, IIS)
- Static file serving capability

**Steps**:
1. Build: `npm run build`
2. Copy `dist/` contents to web server root
3. Configure server for SPA routing (all routes → index.html)

**Nginx Configuration Example**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Environment Considerations

**Development**:
- Port: 3000
- Hot reload enabled
- Source maps enabled
- Unminified code

**Production**:
- Optimized bundles
- Minified code
- Tree-shaking applied
- Asset hashing for caching

### Performance Optimizations

**Already Implemented**:
- Code splitting by Vite
- Asset optimization
- CSS purging via Tailwind
- React optimizations (StrictMode)

**Additional Recommendations**:
- Enable Gzip/Brotli compression on server
- Configure caching headers for static assets
- Use CDN for global distribution
- Monitor bundle size with `npm run build -- --analyze`

---

## API Reference

### Context API

#### useData()

**Returns**: `DataContextType`

```typescript
const { clinicalData, metrics, loadData, clearData } = useData()
```

**Properties**:
- `clinicalData: ClinicalData | null` - Current clinical data
- `metrics: DashboardMetrics | null` - Calculated metrics
- `loadData: (data: ClinicalData) => void` - Load new data
- `clearData: () => void` - Clear all data

**Usage**:
```typescript
import { useData } from '../context/DataContext'

const MyComponent = () => {
  const { clinicalData, metrics, loadData } = useData()
  // Use data...
}
```

### Utility Functions

#### parseCSV(file: File): Promise<any[]>

**Parameters**:
- `file: File` - CSV file object

**Returns**: `Promise<any[]>` - Parsed CSV data as array of objects

**Throws**: Error if parsing fails

**Usage**:
```typescript
const rawData = await parseCSV(file)
```

#### cleanPatientData(rawData: any[]): Patient[]

**Parameters**:
- `rawData: any[]` - Raw CSV data

**Returns**: `Patient[]` - Array of cleaned Patient objects

**Usage**:
```typescript
const patients = cleanPatientData(rawData)
```

#### extractSites(patients: Patient[]): Site[]

**Parameters**:
- `patients: Patient[]` - Array of patient objects

**Returns**: `Site[]` - Array of unique sites

**Usage**:
```typescript
const sites = extractSites(patients)
```

#### processClinicalData(rawData: any[]): ClinicalData

**Parameters**:
- `rawData: any[]` - Raw CSV data

**Returns**: `ClinicalData` - Complete clinical data structure

**Usage**:
```typescript
const clinicalData = processClinicalData(rawData)
```

#### calculateMetrics(data: ClinicalData): DashboardMetrics

**Parameters**:
- `data: ClinicalData` - Clinical data object

**Returns**: `DashboardMetrics` - Calculated metrics

**Usage**:
```typescript
const metrics = calculateMetrics(clinicalData)
```

### Routing

#### Routes

- `/` - Dashboard view
- `/site/:siteId` - Site report view (dynamic route)

**Navigation**:
```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()
navigate('/site/SITE-001')  // Navigate to site report
```

---

## Data Format Requirements

### CSV File Format

**Required Columns** (case-insensitive):
- Patient ID: `patientId`, `patient_id`, or `id`
- Site ID: `siteId`, `site_id`, or `site`
- Age: `age`
- Gender: `gender` or `sex`
- Enrollment Date: `enrollmentDate`, `enrollment_date`, or `date`
- Status: `status` or `patientStatus`
- Treatment: `treatment`, `treatmentGroup`, or `arm`

**Supported Formats**:
- CSV files only (`.csv` extension)
- Headers must be in first row
- Dates: ISO format preferred (YYYY-MM-DD)

**Example CSV**:
```csv
patientId,siteId,age,gender,enrollmentDate,status,treatment
P001,SITE-001,45,M,2024-01-15,Active,Control
P002,SITE-001,52,F,2024-01-20,Completed,Treatment
```

### Data Normalization

The system automatically:
- Normalizes column names (removes spaces, lowercases)
- Handles missing values with defaults
- Validates data types
- Filters invalid rows

---

## Troubleshooting

### Common Issues

1. **CSV Not Loading**:
   - Verify file is `.csv` format
   - Check column names match supported formats
   - Ensure headers are in first row

2. **Charts Not Displaying**:
   - Verify data is loaded correctly
   - Check browser console for errors
   - Ensure data has values for chart axes

3. **Site Report Not Found**:
   - Verify siteId exists in data
   - Check URL parameter matches site ID exactly
   - Ensure data is loaded before navigation

4. **Build Errors**:
   - Run `npm install` to ensure dependencies
   - Check TypeScript errors with `tsc --noEmit`
   - Verify Node.js version (requires Node 18+)

---

## Future Enhancements

### Potential Improvements

1. **Data Export**: Export processed data as CSV/JSON
2. **Filtering**: Filter patients by criteria
3. **Search**: Search patients and sites
4. **Charts**: Additional chart types (heatmaps, timelines)
5. **Authentication**: User authentication and data persistence
6. **Backend Integration**: API connection for real-time data
7. **Advanced Metrics**: Statistical analysis and comparisons
8. **Data Validation**: More robust CSV validation and error reporting

---

## License & Credits

**Technologies Used**:
- React - UI Framework
- Vite - Build Tool
- Recharts - Data Visualization
- PapaParse - CSV Parsing
- Tailwind CSS - Styling
- TypeScript - Type Safety

---

## Version History

- **v1.0.0**: Initial release
  - CSV upload functionality
  - Dashboard with metrics and charts
  - Site-specific reports
  - Data cleaning and normalization

---

**Last Updated**: 2024


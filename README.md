# CT-Viz Dashboard

Clinical Trial Visualizer Dashboard - Frontend component

## Overview

This is the frontend dashboard for CT-Viz, designed to visualize clinical trial data with interactive charts, metrics, and site-specific reports.

## Features

- **Data Upload**: Drag-and-drop CSV file upload with automatic data cleaning
- **Interactive Dashboard**: 
  - Key metrics (total patients, sites, enrollment rate, completion rate)
  - Patient status distribution
  - Gender and age distribution
  - Site performance comparisons
- **Site Reports**: Detailed per-site analysis with patient lists and visualizations
- **Data Intelligence**: Automatic data cleaning and normalization for clinical trial datasets

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The dashboard will open at `http://localhost:3000`

## CSV Format

Upload CSV files with clinical trial data. Supported columns (case-insensitive):
- `patientId` or `patient_id` or `id`
- `siteId` or `site_id` or `site`
- `age`
- `gender` or `sex`
- `enrollmentDate` or `enrollment_date` or `date`
- `status` or `patientStatus`
- `treatment` or `treatmentGroup` or `arm`

## Sample Data

- Click "Use sample data" in the upload card to instantly populate the dashboard with realistic synthetic data (no CSV required).
- For CSV structure reference, see `sample-data.csv`.

## Build

```bash
npm run build
```

Build output will be in the `dist` directory.

## Deployment to GitHub Pages

This dashboard is configured to deploy automatically to GitHub Pages.

### Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys your dashboard whenever you push to the `main` or `master` branch.

**Setup Steps:**

1. **Enable GitHub Pages** in your repository settings:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

2. **Push your code** to the main branch:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

3. **Wait for deployment**: The GitHub Actions workflow will automatically:
   - Build your application
   - Deploy it to GitHub Pages
   - Your dashboard will be available at: `https://srthecoder.github.io/ct-viz/`

### Manual Deployment

If you prefer to deploy manually:

```bash
npm run deploy
```

This will build the project and push it to the `gh-pages` branch.

**Note**: After the first deployment, GitHub Pages may take a few minutes to become available. You can check the deployment status in the **Actions** tab of your repository.


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import Dashboard from './components/Dashboard'
import SiteReport from './components/SiteReport'
import Layout from './components/Layout'

function App() {
  return (
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
  )
}

export default App


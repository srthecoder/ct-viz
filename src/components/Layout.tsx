import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Database, Home } from 'lucide-react'
import { useData } from '../context/DataContext'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { clinicalData } = useData()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vet-Viz</h1>
                <p className="text-xs text-gray-500">Veterinary Trial Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              {clinicalData && (
                <div className="text-sm text-gray-600">
                  {clinicalData.patients.length} patients across {clinicalData.sites.length} clinics
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout


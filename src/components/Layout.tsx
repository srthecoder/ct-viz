import React, { ReactNode, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, Home, Upload } from 'lucide-react'
import { useData } from '../context/DataContext'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { clinicalData, clearData } = useData()
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const handleClearData = () => {
    clearData()
    navigate('/')
  }

  useEffect(() => {
    if (clinicalData) {
      setLastUpdate(new Date())
    }
  }, [clinicalData])

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleClearData}
                className="flex items-center hover:opacity-80 transition-opacity"
                title="Go to home page"
              >
                <Database className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Vet-Viz</h1>
                  <p className="text-xs text-gray-500">Veterinary Practice Dashboard</p>
                </div>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {clinicalData ? (
                <>
                  <button
                    onClick={handleClearData}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Clear data and return to home"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </button>
                  <button
                    onClick={handleClearData}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                    title="Upload new data"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    New Upload
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700">Live</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {clinicalData.patients.length} patients across {clinicalData.sites.length} clinics
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated {getTimeAgo(lastUpdate)}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/"
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
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


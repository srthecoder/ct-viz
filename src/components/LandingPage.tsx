import React from 'react'
import { 
  Activity, 
  Pill, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  BarChart3,
  Upload,
  Clock,
  Shield,
  Zap
} from 'lucide-react'
import DataUpload from './DataUpload'

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Activity className="h-8 w-8" />,
      title: "Lab Results Analysis",
      description: "Track blood test results over time. Compare historical values with current readings to identify trends and make informed clinical decisions.",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      icon: <Pill className="h-8 w-8" />,
      title: "Medication Tracking",
      description: "Monitor medication administration records, track dosages, schedules, and patient compliance. Reduce medication errors.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Financial Dashboard",
      description: "View billing data, payment status, outstanding balances, and financial analytics to manage your practice efficiently.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Real-time Monitoring",
      description: "Get instant updates on patient status, lab results, and clinic performance. Make decisions faster with live data.",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "X-Ray Analysis",
      description: "Track X-ray scan results, scores, and findings. Visualize imaging data alongside clinical records.",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: "Easy Data Import",
      description: "Upload CSV files or connect to your practice management system. No manual data entry required.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ]

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      text: "Save time on manual data entry"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      text: "Reduce medication errors"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      text: "Make faster clinical decisions"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      text: "Track trends and patterns"
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg border border-blue-100">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Veterinary Practice Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-2 max-w-2xl mx-auto">
          Streamline your practice with real-time lab results, medication tracking, and financial insights
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-xl mx-auto">
          Eliminate manual data entry. Make faster clinical decisions. Manage your practice more efficiently.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
              <div className="text-blue-600">{benefit.icon}</div>
              <span className="text-sm text-gray-700">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`${feature.bgColor} rounded-lg p-6 border-2 border-transparent hover:border-gray-300 transition-all cursor-pointer`}
            >
              <div className={`${feature.color} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Upload Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Get Started
        </h2>
        <p className="text-gray-600 mb-4 text-center max-w-2xl mx-auto">
          Upload your veterinary data to start analyzing lab results, tracking medications, and viewing financial insights. 
          Supports CSV files with lab results, medication records, billing data, and X-ray scans.
        </p>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-2xl mx-auto">
          Compatible with datasets from <a href="https://github.com/Vetdatahub/VetDataHub" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">VetDataHub</a> and other veterinary data sources.
        </p>
        <DataUpload />
      </div>

      {/* Quick Stats Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">Real-time</div>
          <div className="text-sm text-gray-600">Data Updates</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">Historical</div>
          <div className="text-sm text-gray-600">Trend Analysis</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">Automated</div>
          <div className="text-sm text-gray-600">Data Import</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">Comprehensive</div>
          <div className="text-sm text-gray-600">Reporting</div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

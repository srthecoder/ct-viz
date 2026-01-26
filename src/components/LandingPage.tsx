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
  CheckCircle2
} from 'lucide-react'
import DataUpload from './DataUpload'

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <Activity className="h-8 w-8 text-red-600" />,
      title: "Lab Results Analysis",
      description: "Track blood test results over time. Compare historical values with current readings to identify trends and abnormalities.",
      highlights: [
        "Historical vs. current comparison",
        "Trend visualization",
        "Abnormal value alerts",
        "Multi-parameter tracking"
      ],
      color: "red"
    },
    {
      icon: <Pill className="h-8 w-8 text-blue-600" />,
      title: "Medication Management",
      description: "Monitor medication administration records, track dosages, frequencies, and treatment compliance.",
      highlights: [
        "Administration history",
        "Dosage tracking",
        "Compliance monitoring",
        "Treatment timelines"
      ],
      color: "blue"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "Billing & Financial",
      description: "View financial records, payment status, outstanding balances, and revenue analytics.",
      highlights: [
        "Payment tracking",
        "Outstanding balances",
        "Revenue analytics",
        "Financial reports"
      ],
      color: "green"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      title: "Real-Time Dashboard",
      description: "Get instant insights with live data updates. Monitor clinic performance, patient status, and key metrics.",
      highlights: [
        "Live data updates",
        "Performance metrics",
        "Quick decision support",
        "Automated insights"
      ],
      color: "purple"
    }
  ]

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      text: "Reduce manual data entry time by 70%"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      text: "Make faster clinical decisions with historical comparisons"
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      text: "Track medication compliance and treatment outcomes"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      text: "Export reports for client communication and records"
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-xl shadow-lg p-8 md:p-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Activity className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vet-Viz Practice Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your veterinary practice with intelligent data visualization. 
            Track lab results, medications, billing, and patient records all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <DataUpload />
            <div className="text-sm text-gray-500 mt-4 sm:mt-0 sm:ml-4">
              <p>Upload your CSV data to get started</p>
              <p className="text-xs mt-1">No setup required • Works with any format</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Key Features</h2>
        <p className="text-gray-600 text-center mb-8">
          Everything you need to manage your veterinary practice efficiently
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-${feature.color}-50`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How Vet-Viz Helps Your Practice
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {benefit.icon}
              </div>
              <p className="text-gray-700 font-medium">{benefit.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Upload Data</h3>
            <p className="text-sm text-gray-600">
              Upload your CSV file with patient records, lab results, medications, or billing data
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Automatic Analysis</h3>
            <p className="text-sm text-gray-600">
              The dashboard automatically detects your data structure and creates relevant visualizations
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Get Insights</h3>
            <p className="text-sm text-gray-600">
              View trends, compare historical data, track medications, and monitor financials
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 rounded-xl shadow-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Scroll up to upload your data and see how Vet-Viz can transform your practice management. 
          No credit card required, works with any CSV format.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center px-6 py-3 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Data
        </button>
      </div>
    </div>
  )
}

export default LandingPage

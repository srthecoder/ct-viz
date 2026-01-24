import React, { useMemo } from 'react'
import { DollarSign, TrendingUp, CreditCard, Receipt } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import CollapsibleSection from './CollapsibleSection'

interface BillingViewProps {
  rawData: any[]
}

const BillingView: React.FC<BillingViewProps> = ({ rawData }) => {
  // Billing-related columns
  const billingColumns = [
    'amount', 'cost', 'price', 'fee', 'charge',
    'payment', 'billing', 'invoice', 'balance',
    'outstanding', 'paid', 'status', 'paymentStatus'
  ]

  // Find billing data in the dataset
  const billingData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    const firstRow = rawData[0]
    if (!firstRow) return []

    const hasBillingData = billingColumns.some(col => 
      Object.keys(firstRow).some(key => 
        key.toLowerCase().includes(col.toLowerCase())
      )
    )

    if (!hasBillingData) return []

    return rawData.map(row => {
      // Try to find amount/cost column - check multiple variations
      const amountStr = row['amount'] || row['cost'] || row['price'] || row['fee'] || row['charge'] || '0'
      const amount = parseFloat(String(amountStr))
      
      const paymentStr = row['payment'] || row['paid'] || '0'
      const payment = parseFloat(String(paymentStr))
      
      const balanceStr = row['balance'] || row['outstanding'] || '0'
      const balance = parseFloat(String(balanceStr))
      
      const status = String(row['paymentStatus'] || row['paymentstatus'] || row['status'] || 'pending').toLowerCase()
      const date = row['enrollmentDate'] || row['enrollment_date'] || row['date'] || row['visitDate'] || row['visit_date'] || row['visit']
      const patientId = row['patientId'] || row['patient_id'] || row['id'] || row['subjectId'] || ''

      return {
        amount: isNaN(amount) ? 0 : amount,
        payment: isNaN(payment) ? 0 : payment,
        balance: isNaN(balance) ? 0 : balance,
        status: status,
        date: date ? String(date).split('T')[0] : null,
        patientId: String(patientId)
      }
    }).filter(item => item.amount > 0 || item.balance > 0 || item.payment > 0)
  }, [rawData])

  // Financial summary
  const financialSummary = useMemo(() => {
    const totalAmount = billingData.reduce((sum, item) => sum + item.amount, 0)
    const totalPaid = billingData.reduce((sum, item) => sum + item.payment, 0)
    const totalOutstanding = billingData.reduce((sum, item) => sum + item.balance, 0)
    const paidCount = billingData.filter(item => 
      item.status === 'paid' || item.status === 'complete' || item.payment >= item.amount
    ).length

    return {
      totalAmount,
      totalPaid,
      totalOutstanding,
      paidCount,
      unpaidCount: billingData.length - paidCount,
      collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0
    }
  }, [billingData])

  // Payment status distribution
  const paymentStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {}
    billingData.forEach(item => {
      const status = item.status === 'paid' || item.status === 'complete' || item.payment >= item.amount
        ? 'Paid'
        : item.status === 'pending' || item.status === 'unpaid'
        ? 'Pending'
        : 'Other'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [billingData])

  // Revenue timeline
  const revenueTimeline = useMemo(() => {
    const timeline: Record<string, { amount: number; paid: number }> = {}
    billingData.forEach(item => {
      if (item.date) {
        const month = item.date.substring(0, 7) // YYYY-MM
        if (!timeline[month]) {
          timeline[month] = { amount: 0, paid: 0 }
        }
        timeline[month].amount += item.amount
        timeline[month].paid += item.payment
      }
    })
    return Object.entries(timeline)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, values]) => ({
        date: date.split('-').reverse().join('/'), // MM/YYYY format
        amount: values.amount,
        paid: values.paid,
        outstanding: values.amount - values.paid
      }))
  }, [billingData])

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280']

  if (billingData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No billing data available in the current dataset.</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload data with columns like: amount, cost, payment, balance, paymentStatus
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <CollapsibleSection
        title="Financial Summary"
        icon={<DollarSign className="h-5 w-5 text-green-600" />}
        defaultOpen={true}
        badge={billingData.length}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialSummary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">
                ${financialSummary.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                ${financialSummary.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Receipt className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {financialSummary.collectionRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        </div>
      </CollapsibleSection>

      {/* Charts */}
      <CollapsibleSection
        title="Payment Analysis"
        icon={<TrendingUp className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status */}
        {paymentStatusData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Payment Status Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue vs Paid */}
        {revenueTimeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Revenue Timeline</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" name="Total Revenue" />
                <Bar dataKey="paid" fill="#10b981" name="Collected" />
                <Bar dataKey="outstanding" fill="#ef4444" name="Outstanding" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        </div>
      </CollapsibleSection>

      {/* Revenue Trend Line */}
      {revenueTimeline.length > 1 && (
        <CollapsibleSection
          title="Revenue Trend"
          icon={<TrendingUp className="h-5 w-5" />}
          defaultOpen={false}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Total Revenue" />
              <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} name="Collected" />
            </LineChart>
          </ResponsiveContainer>
        </CollapsibleSection>
      )}
    </div>
  )
}

export default BillingView

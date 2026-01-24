import React, { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface BillingViewProps {
  rawData: any[]
}

const BillingView: React.FC<BillingViewProps> = ({ rawData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all')

  // Extract billing data
  const billingData = useMemo(() => {
    if (!rawData) return []
    
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '')
    const bills: Array<{
      patientId: string
      amount: number
      cost: number
      payment: number
      balance: number
      paymentStatus: string
      date: string
      service: string
    }> = []
    
    rawData.forEach(row => {
      const normalizedRow: Record<string, any> = {}
      Object.keys(row).forEach(key => {
        normalizedRow[normalizeKey(key)] = row[key]
      })
      
      const patientId = normalizedRow['patientid'] || normalizedRow['patient_id'] || normalizedRow['id']
      const amount = parseFloat(normalizedRow['amount'] || normalizedRow['cost'] || normalizedRow['total'] || '0')
      const cost = parseFloat(normalizedRow['cost'] || normalizedRow['amount'] || '0')
      const payment = parseFloat(normalizedRow['payment'] || normalizedRow['paid'] || '0')
      const balance = parseFloat(normalizedRow['balance'] || normalizedRow['outstanding'] || String(amount - payment))
      const paymentStatus = normalizedRow['paymentstatus'] || normalizedRow['status'] || 
        (balance <= 0 ? 'Paid' : balance < amount ? 'Partial' : 'Unpaid')
      const date = normalizedRow['date'] || normalizedRow['visitdate'] || normalizedRow['enrollmentdate'] || new Date().toISOString().split('T')[0]
      const service = normalizedRow['service'] || normalizedRow['servicetype'] || 'General'
      
      if (patientId && amount > 0) {
        bills.push({
          patientId: String(patientId),
          amount,
          cost,
          payment,
          balance: isNaN(balance) ? amount - payment : balance,
          paymentStatus: String(paymentStatus),
          date: String(date).split('T')[0],
          service: String(service)
        })
      }
    })
    
    return bills
  }, [rawData])

  // Filter by period
  const filteredBilling = useMemo(() => {
    if (selectedPeriod === 'all') return billingData
    
    const now = new Date()
    const cutoff = new Date()
    
    if (selectedPeriod === 'month') {
      cutoff.setMonth(now.getMonth() - 1)
    } else if (selectedPeriod === 'week') {
      cutoff.setDate(now.getDate() - 7)
    }
    
    return billingData.filter(bill => {
      const billDate = new Date(bill.date)
      return billDate >= cutoff
    })
  }, [billingData, selectedPeriod])

  // Financial statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredBilling.reduce((sum, bill) => sum + bill.payment, 0)
    const totalBilled = filteredBilling.reduce((sum, bill) => sum + bill.amount, 0)
    const outstandingBalance = filteredBilling.reduce((sum, bill) => sum + bill.balance, 0)
    const paidCount = filteredBilling.filter(bill => bill.balance <= 0).length
    const unpaidCount = filteredBilling.filter(bill => bill.balance > 0).length
    const collectionRate = totalBilled > 0 ? (totalRevenue / totalBilled) * 100 : 0
    
    return {
      totalRevenue,
      totalBilled,
      outstandingBalance,
      paidCount,
      unpaidCount,
      collectionRate,
      totalTransactions: filteredBilling.length
    }
  }, [filteredBilling])

  // Revenue by date
  const revenueByDate = useMemo(() => {
    const dateMap = new Map<string, number>()
    filteredBilling.forEach(bill => {
      const current = dateMap.get(bill.date) || 0
      dateMap.set(bill.date, current + bill.payment)
    })
    
    return Array.from(dateMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredBilling])

  // Payment status distribution
  const paymentStatusData = useMemo(() => {
    const statusMap = new Map<string, number>()
    filteredBilling.forEach(bill => {
      const status = bill.balance <= 0 ? 'Paid' : bill.balance < bill.amount ? 'Partial' : 'Unpaid'
      const count = statusMap.get(status) || 0
      statusMap.set(status, count + 1)
    })
    
    return Array.from(statusMap.entries())
      .map(([status, count]) => ({ name: status, value: count }))
  }, [filteredBilling])

  // Service revenue
  const serviceRevenue = useMemo(() => {
    const serviceMap = new Map<string, number>()
    filteredBilling.forEach(bill => {
      const current = serviceMap.get(bill.service) || 0
      serviceMap.set(bill.service, current + bill.amount)
    })
    
    return Array.from(serviceMap.entries())
      .map(([service, revenue]) => ({ service, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredBilling])

  const COLORS = ['#10b981', '#f59e0b', '#ef4444']

  if (billingData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No billing data found in the uploaded dataset.</p>
        <p className="text-sm text-gray-500 mt-2">
          Include columns like amount, cost, payment, balance, paymentStatus, etc.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Billing & Financial Overview
          </h2>
          <p className="text-gray-600 mt-1">Track revenue, payments, and outstanding balances</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'all' | 'month' | 'week')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="week">Last Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ${stats.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.collectionRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.paidCount} paid, {stats.unpaidCount} unpaid
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Revenue Timeline */}
      {revenueByDate.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment Status Distribution */}
      {paymentStatusData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
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

          {/* Service Revenue */}
          {serviceRevenue.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Outstanding Balances */}
      {filteredBilling.filter(b => b.balance > 0).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Balances</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBilling
                  .filter(b => b.balance > 0)
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 20)
                  .map((bill, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{bill.patientId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{bill.service}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        ${bill.payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">
                        ${bill.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{bill.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bill.balance <= 0 
                            ? 'bg-green-100 text-green-800' 
                            : bill.balance < bill.amount
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingView

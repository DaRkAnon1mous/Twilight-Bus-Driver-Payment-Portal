import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PaymentHistory({ drivers }) {
  const [settlements, setSettlements] = useState([])
  const [filterDriver, setFilterDriver] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const fetchSettlements = async () => {
    setLoading(true)
    
    let query = supabase
      .from('settlements')
      .select(`
        *,
        driver:drivers(name, payment_preference),
        settlement_items(*, trip:trips(*, route:routes(name)))
      `)
      .order('settled_at', { ascending: false })

    if (filterDriver) {
      query = query.eq('driver_id', filterDriver)
    }

    if (filterType) {
      query = query.eq('settlement_type', filterType)
    }

    const { data } = await query
    setSettlements(data || [])
    setLoading(false)
  }

  fetchSettlements()
}, [filterDriver, filterType])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Payment History</h2>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Driver
            </label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Drivers</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="weekly">Weekly (Batta)</option>
              <option value="monthly">Monthly (Salary)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : settlements.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          No settlements found
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map(settlement => (
            <div key={settlement.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{settlement.driver?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {settlement.settlement_type === 'weekly' ? 'Weekly (Batta)' : 'Monthly (Salary)'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{parseFloat(settlement.total_amount).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(settlement.settled_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                Period: {new Date(settlement.period_start).toLocaleDateString()} - {new Date(settlement.period_end).toLocaleDateString()}
              </div>

              {settlement.notes && (
                <div className="text-sm text-gray-600 mb-3">
                  {settlement.notes}
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 text-sm font-medium">
                  View Trip Details ({settlement.settlement_items?.length || 0} trips)
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {settlement.settlement_items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{item.trip?.route?.name || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm capitalize">{item.component_type}</td>
                          <td className="px-4 py-2 text-sm text-right">₹{parseFloat(item.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
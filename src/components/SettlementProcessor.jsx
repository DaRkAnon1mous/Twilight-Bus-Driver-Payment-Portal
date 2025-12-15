import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SettlementProcessor({ drivers }) {
  const [settlementType, setSettlementType] = useState('weekly')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [pendingTrips, setPendingTrips] = useState([])
  const [settlementSummary, setSettlementSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (selectedDriver) {
      fetchPendingTrips()
    }
  }, [selectedDriver, settlementType])

  const fetchPendingTrips = async () => {
    // Get all completed trips that haven't been settled yet
    const { data: trips } = await supabase
      .from('trips')
      .select(`
        *,
        driver:drivers(*),
        route:routes(*),
        vehicle:vehicles(*),
        settlement_items(*)
      `)
      .eq('driver_id', selectedDriver)
      .eq('status', 'completed')
      .order('trip_date', { ascending: false })

    
    const unsettledTrips = trips?.filter(trip => {
      return !trip.settlement_items || trip.settlement_items.length === 0
    }) || []

    setPendingTrips(unsettledTrips)
    calculateSettlement(unsettledTrips)
  }

  const calculateSettlement = (trips) => {
    if (trips.length === 0) {
      setSettlementSummary(null)
      return
    }

    const driver = trips[0]?.driver
    if (!driver) return

    let battaAmount = 0
    let salaryAmount = 0
    const tripDetails = []

    trips.forEach(trip => {
      const route = trip.route
      if (!route) return

      const battaPerTrip = parseFloat(route.batta_per_trip)
      const salaryPerTrip = parseFloat(route.salary_per_trip)
      const totalPerTrip = battaPerTrip + salaryPerTrip

      let tripBatta = 0
      let tripSalary = 0

      if (driver.payment_preference === 'batta_only') {
        tripBatta = totalPerTrip
      } else if (driver.payment_preference === 'salary_only') {
        tripSalary = totalPerTrip
      } else { // both
        tripBatta = battaPerTrip
        tripSalary = salaryPerTrip
      }

      
      if (settlementType === 'weekly') {
        battaAmount += tripBatta
        tripDetails.push({
          trip_id: trip.id,
          route: route.name,
          date: trip.trip_date,
          amount: tripBatta,
          component: 'batta'
        })
      } else { // monthly
        salaryAmount += tripSalary
        tripDetails.push({
          trip_id: trip.id,
          route: route.name,
          date: trip.trip_date,
          amount: tripSalary,
          component: 'salary'
        })
      }
    })

    const totalAmount = settlementType === 'weekly' ? battaAmount : salaryAmount

    setSettlementSummary({
      driver: driver.name,
      driverPreference: driver.payment_preference,
      settlementType,
      totalAmount,
      battaAmount,
      salaryAmount,
      tripCount: trips.length,
      tripDetails: tripDetails.filter(t => t.amount > 0)
    })
  }

  const processSettlement = async () => {
    if (!settlementSummary || settlementSummary.totalAmount === 0) {
      setMessage('No amount to settle for this period')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Get date range
      const dates = pendingTrips.map(t => t.trip_date).sort()
      const periodStart = dates[0]
      const periodEnd = dates[dates.length - 1]

      // Create settlement record
      const { data: settlement, error: settlementError } = await supabase
        .from('settlements')
        .insert([{
          driver_id: selectedDriver,
          settlement_type: settlementType,
          total_amount: settlementSummary.totalAmount,
          period_start: periodStart,
          period_end: periodEnd,
          notes: `${settlementType} settlement for ${settlementSummary.tripCount} trips`
        }])
        .select()
        .single()

      if (settlementError) throw settlementError

      
      const items = settlementSummary.tripDetails.map(detail => ({
        settlement_id: settlement.id,
        trip_id: detail.trip_id,
        amount: detail.amount,
        component_type: detail.component
      }))

      const { error: itemsError } = await supabase
        .from('settlement_items')
        .insert(items)

      if (itemsError) throw itemsError

      setMessage(`Settlement processed successfully! Amount: ₹${settlementSummary.totalAmount.toFixed(2)}`)
      setPendingTrips([])
      setSettlementSummary(null)
      setSelectedDriver('')
    } catch (error) {
      setMessage('Error processing settlement: ' + error.message)
    }

    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Process Settlements</h2>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Settlement Type
            </label>
            <select
              value={settlementType}
              onChange={(e) => setSettlementType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly (Batta)</option>
              <option value="monthly">Monthly (Salary)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {settlementSummary && settlementSummary.totalAmount > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Settlement Summary</h3>
            
            <div className="bg-gray-50 p-4 rounded mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Driver:</span>
                  <span className="ml-2 font-medium">{settlementSummary.driver}</span>
                </div>
                <div>
                  <span className="text-gray-600">Preference:</span>
                  <span className="ml-2 font-medium">{settlementSummary.driverPreference.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{settlementSummary.settlementType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Trips:</span>
                  <span className="ml-2 font-medium">{settlementSummary.tripCount}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-2xl font-bold text-blue-600">
                  Total Amount: ₹{settlementSummary.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Trip Details:</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settlementSummary.tripDetails.map((detail, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{new Date(detail.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">{detail.route}</td>
                        <td className="px-4 py-2 text-sm capitalize">{detail.component}</td>
                        <td className="px-4 py-2 text-sm text-right">₹{detail.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={processSettlement}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Processing...' : `Process Settlement - ₹${settlementSummary.totalAmount.toFixed(2)}`}
            </button>
          </div>
        )}

        {selectedDriver && settlementSummary && settlementSummary.totalAmount === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              No pending {settlementType} payments for this driver.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
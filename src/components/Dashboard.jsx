import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTrips: 0,
    pendingBatta: 0,
    pendingSalary: 0,
    totalDrivers: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      // Get total trips
      const { count: tripCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get total drivers
      const { count: driverCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })

      // Calculate pending payments
      const { data: trips } = await supabase
        .from('trips')
        .select(`
          *,
          driver:drivers(*),
          route:routes(*),
          settlement_items(*)
        `)
        .eq('status', 'completed')

      let pendingBatta = 0
      let pendingSalary = 0

      trips?.forEach(trip => {
        // Skip if already settled
        if (trip.settlement_items && trip.settlement_items.length > 0) return

        const route = trip.route
        const driver = trip.driver
        
        if (!route || !driver) return

        const totalPerTrip = parseFloat(route.batta_per_trip) + parseFloat(route.salary_per_trip)

        if (driver.payment_preference === 'batta_only') {
          pendingBatta += totalPerTrip
        } else if (driver.payment_preference === 'salary_only') {
          pendingSalary += totalPerTrip
        } else {
          pendingBatta += parseFloat(route.batta_per_trip)
          pendingSalary += parseFloat(route.salary_per_trip)
        }
      })

      setStats({
        totalTrips: tripCount || 0,
        pendingBatta: pendingBatta.toFixed(2),
        pendingSalary: pendingSalary.toFixed(2),
        totalDrivers: driverCount || 0
      })
    }

    fetchStats()
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm font-medium">Total Drivers</div>
          <div className="text-3xl font-bold mt-2">{stats.totalDrivers}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500 text-sm font-medium">Total Trips</div>
          <div className="text-3xl font-bold mt-2">{stats.totalTrips}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-yellow-600 text-sm font-medium">Pending Batta (Weekly)</div>
          <div className="text-3xl font-bold mt-2">₹{stats.pendingBatta}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-blue-600 text-sm font-medium">Pending Salary (Monthly)</div>
          <div className="text-3xl font-bold mt-2">₹{stats.pendingSalary}</div>
        </div>
      </div>
    </div>
  )
}
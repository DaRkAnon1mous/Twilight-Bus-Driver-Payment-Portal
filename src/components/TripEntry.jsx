import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TripEntry({ drivers, routes, vehicles, onTripAdded }) {
  const [formData, setFormData] = useState({
    driver_id: '',
    route_id: '',
    vehicle_id: '',
    trip_date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('trips').insert([{
      driver_id: formData.driver_id,
      route_id: formData.route_id,
      vehicle_id: formData.vehicle_id,
      trip_date: formData.trip_date,
      status: 'completed'
    }])

    if (error) {
      setMessage('Error adding trip: ' + error.message)
    } else {
      setMessage('Trip added successfully!')
      setFormData({
        driver_id: '',
        route_id: '',
        vehicle_id: '',
        trip_date: new Date().toISOString().split('T')[0]
      })
      onTripAdded()
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Add New Trip</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver
            </label>
            <select
              required
              value={formData.driver_id}
              onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.payment_preference.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route
            </label>
            <select
              required
              value={formData.route_id}
              onChange={(e) => setFormData({...formData, route_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Route</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name} (Batta: ₹{route.batta_per_trip}, Salary: ₹{route.salary_per_trip})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle
            </label>
            <select
              required
              value={formData.vehicle_id}
              onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Date
            </label>
            <input
              type="date"
              required
              value={formData.trip_date}
              onChange={(e) => setFormData({...formData, trip_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Adding...' : 'Add Trip'}
          </button>

          {message && (
            <div className={`p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
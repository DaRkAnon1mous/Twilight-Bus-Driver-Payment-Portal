import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import Auth from './components/Auth'
import TripEntry from './components/TripEntry'
import SettlementProcessor from './components/SettlementProcessor'
import PaymentHistory from './components/PaymentHistory'
import Dashboard from './components/Dashboard'

function App() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [drivers, setDrivers] = useState([])
  const [routes, setRoutes] = useState([])
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    if (user) {
      fetchMasterData()
    }
  }, [user])

  const fetchMasterData = async () => {
    const [driversRes, routesRes, vehiclesRes] = await Promise.all([
      supabase.from('drivers').select('*').order('name'),
      supabase.from('routes').select('*').order('name'),
      supabase.from('vehicles').select('*').order('vehicle_number')
    ])
    
    setDrivers(driversRes.data || [])
    setRoutes(routesRes.data || [])
    setVehicles(vehiclesRes.data || [])
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) {
    return <Auth />
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'trips', label: 'Add Trip' },
    { id: 'settlements', label: 'Process Settlements' },
    { id: 'history', label: 'Payment History' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Driver Payment System</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'trips' && (
          <TripEntry 
            drivers={drivers} 
            routes={routes} 
            vehicles={vehicles}
            onTripAdded={fetchMasterData}
          />
        )}
        {activeTab === 'settlements' && (
          <SettlementProcessor drivers={drivers} />
        )}
        {activeTab === 'history' && <PaymentHistory drivers={drivers} />}
      </main>
    </div>
  )
}

export default App
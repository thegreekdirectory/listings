import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, User, Home, List, Settings, BarChart, Plus, Edit, Trash2, Eye, Search } from 'lucide-react';

// IMPORTANT: Replace with your Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('greekDirectoryUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const user = { email: data.email, name: data.name, role: data.role };
        setCurrentUser(user);
        setIsAuthenticated(true);
        sessionStorage.setItem('greekDirectoryUser', JSON.stringify(user));
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('greekDirectoryUser');
    setCurrentPage('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} loading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} onLogout={handleLogout} />
      <div className="flex">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="flex-1 p-6">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'listings' && <ListingsManager />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'settings' && <SettingsPage user={currentUser} />}
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (email && password) {
      onLogin(email, password);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="https://social.thegreekdirectory.org/Logo2.png" 
            alt="The Greek Directory" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#055193' }}>
            The Greek Directory
          </h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#055193' }}
                placeholder="admin@thegreekdirectory.org"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#055193' }}
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#055193' }}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Demo Credentials:</strong><br />
              Email: admin@thegreekdirectory.org<br />
              Password: admin123
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          © 2025 The Greek Directory. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://social.thegreekdirectory.org/Logo2.png" 
            alt="The Greek Directory" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#055193' }}>
              The Greek Directory
            </h1>
            <p className="text-xs text-gray-600">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'listings', label: 'Manage Listings', icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6 hidden md:block">
      <nav className="space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={currentPage === item.id ? { backgroundColor: '#055193' } : {}}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Dashboard() {
  const stats = [
    { label: 'Total Listings', value: '47', change: '+12%', color: '#055193' },
    { label: 'Pending Reviews', value: '8', change: '+3', color: '#FFA500' },
    { label: 'Active Users', value: '234', change: '+18%', color: '#22C55E' },
    { label: 'Page Views', value: '1,245', change: '+25%', color: '#8B5CF6' },
  ];

  const recentActivity = [
    { action: 'New listing submitted', business: 'Zeus Pizza & Pasta', time: '2 hours ago' },
    { action: 'Listing approved', business: 'Athena\'s Kitchen', time: '5 hours ago' },
    { action: 'Profile updated', business: 'St. Nicholas Church', time: '1 day ago' },
    { action: 'New listing submitted', business: 'Greek Market Plus', time: '2 days ago' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: stat.color }}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#055193' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.business}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus size={20} style={{ color: '#055193' }} />
              <span className="font-medium text-gray-900">Add New Listing</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye size={20} style={{ color: '#055193' }} />
              <span className="font-medium text-gray-900">Review Pending Submissions</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <BarChart size={20} style={{ color: '#055193' }} />
              <span className="font-medium text-gray-900">View Full Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsManager() {
  const [listings, setListings] = useState([
    { id: 1, name: 'Athena\'s Kitchen', category: 'Restaurant/Bakery', status: 'Active', date: '2025-01-15' },
    { id: 2, name: 'St. Nicholas Church', category: 'Church', status: 'Active', date: '2025-01-14' },
    { id: 3, name: 'Zeus Pizza', category: 'Restaurant/Bakery', status: 'Pending', date: '2025-01-20' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || listing.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Listings</h2>
          <p className="text-gray-600">Review and manage all business listings</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium"
          style={{ backgroundColor: '#055193' }}
        >
          <Plus size={20} />
          Add Listing
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#055193' }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Business Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date Added</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map(listing => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{listing.name}</td>
                  <td className="py-4 px-4 text-gray-600">{listing.category}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        listing.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{listing.date}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Edit size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Analytics() {
  const monthlyData = [
    { month: 'Jan', views: 450, listings: 35 },
    { month: 'Feb', views: 680, listings: 42 },
    { month: 'Mar', views: 920, listings: 47 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600">Track performance and growth metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Page Views</h3>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{data.month}</span>
                  <span className="text-sm font-bold text-gray-900">{data.views}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: '#055193', width: `${(data.views / 1000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Listings Growth</h3>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{data.month}</span>
                  <span className="text-sm font-bold text-gray-900">{data.listings}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: '#22C55E', width: `${(data.listings / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h3>
        <div className="space-y-3">
          {[
            { name: 'Restaurant/Bakery', count: 18, percentage: 38 },
            { name: 'Church/Religious', count: 12, percentage: 26 },
            { name: 'Retail', count: 8, percentage: 17 },
            { name: 'Greek School', count: 5, percentage: 11 },
            { name: 'Other', count: 4, percentage: 8 },
          ].map((category, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">{category.name}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full"
                    style={{ backgroundColor: '#055193', width: `${category.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm font-bold text-gray-900">
                {category.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ user }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              defaultValue={user.name}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue={user.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              defaultValue={user.role}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>
          <button
            className="px-6 py-2 text-white rounded-lg font-medium"
            style={{ backgroundColor: '#055193' }}
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
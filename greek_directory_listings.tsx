import React, { useState, useEffect } from 'react';
import { Search, Grid, List, MapPin, Phone, Mail, Globe, Clock, ChevronDown, Filter, X, Map } from 'lucide-react';

const CATEGORIES = [
  'Restaurant/Bakery',
  'Church/Religious Organization',
  'Greek School/Cultural Center',
  'Grocery/Imports',
  'Event Services',
  'Retail',
  'Real Estate',
  'Legal/Financial',
  'Other'
];

const GOOGLE_MAPS_API_KEY = 'AIzaSyDpjgYkbEMAcFw0ZqxbkIsDDTkaDFYLkIs';
const GOOGLE_SHEETS_API_KEY = 'YOUR_API_KEY_HERE';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const RANGE = 'Sheet1!A2:Z'; // Adjust based on your sheet structure

// Mock data for demonstration - replace with actual Google Sheets data
const mockListings = [
  {
    id: '1',
    businessName: 'Athena\'s Kitchen',
    description: 'Authentic Greek restaurant serving traditional dishes made with love and the finest ingredients.',
    category: 'Restaurant/Bakery',
    address: '123 Main St, Chicago, IL 60601',
    phone: '(312) 555-0123',
    email: 'info@athenaskitchen.com',
    website: 'https://athenaskitchen.com',
    hours: 'Mon-Sat: 11am-10pm, Sun: 12pm-9pm',
    logo: 'https://via.placeholder.com/300x300/055193/FFFFFF?text=AK',
    photos: ['https://via.placeholder.com/800x600/055193/FFFFFF?text=Photo1'],
    fullName: 'Maria Papadopoulos',
    fromGreece: 'Athens',
    socialMedia: {
      facebook: 'https://facebook.com/athenaskitchen',
      instagram: 'https://instagram.com/athenaskitchen',
    }
  },
  {
    id: '2',
    businessName: 'St. Nicholas Greek Orthodox Church',
    description: 'A welcoming parish serving the Greek Orthodox community with liturgy, fellowship, and cultural programs.',
    category: 'Church/Religious Organization',
    address: '456 Church Ave, Chicago, IL 60614',
    phone: '(312) 555-0456',
    email: 'office@stnicholaschicago.org',
    website: 'https://stnicholaschicago.org',
    hours: 'Sunday Liturgy: 9:30am',
    logo: 'https://via.placeholder.com/300x300/055193/FFFFFF?text=SN',
    photos: [],
    fullName: 'Father Dimitri Kostopoulos',
    fromGreece: 'Thessaloniki',
    socialMedia: {
      facebook: 'https://facebook.com/stnicholaschicago',
    }
  },
  {
    id: '3',
    businessName: 'Hellenic Heritage Language School',
    description: 'Teaching Greek language and culture to the next generation through engaging classes and cultural activities.',
    category: 'Greek School/Cultural Center',
    address: '789 Education Blvd, Skokie, IL 60076',
    phone: '(847) 555-0789',
    email: 'info@hellenicschool.org',
    website: 'https://hellenicschool.org',
    hours: 'Classes: Saturdays 9am-1pm',
    logo: 'https://via.placeholder.com/300x300/055193/FFFFFF?text=HH',
    photos: [],
    fullName: 'Elena Dimitriou',
    fromGreece: 'Crete',
    socialMedia: {
      facebook: 'https://facebook.com/hellenicschool',
      instagram: 'https://instagram.com/hellenicschool',
    }
  }
];

function App() {
  const [view, setView] = useState('list');
  const [showMap, setShowMap] = useState(false);
  const [listings, setListings] = useState(mockListings);
  const [filteredListings, setFilteredListings] = useState(mockListings);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoogleSheetsData();
  }, []);

  const fetchGoogleSheetsData = async () => {
    setLoading(true);
    try {
      // Uncomment when you have API key set up
      /*
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${GOOGLE_SHEETS_API_KEY}`
      );
      const data = await response.json();
      
      // Transform Google Sheets data to listing format
      const transformedListings = data.values.map((row, index) => ({
        id: String(index + 1),
        businessName: row[0],
        description: row[1],
        category: row[2],
        address: row[4],
        phone: row[5],
        website: row[6],
        email: row[7],
        hours: row[8],
        // ... map other fields
      }));
      
      setListings(transformedListings);
      setFilteredListings(transformedListings);
      */
      
      setListings(mockListings);
      setFilteredListings(mockListings);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    let filtered = [...listings];

    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.businessName.localeCompare(b.businessName);
      }
      return 0;
    });

    setFilteredListings(filtered);
  }, [searchTerm, selectedCategory, sortBy, listings]);

  if (selectedListing) {
    return <ListingDetail listing={selectedListing} onBack={() => setSelectedListing(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
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
                <p className="text-xs text-gray-600">Chicagoland Listings</p>
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search businesses, churches, schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#055193' }}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg whitespace-nowrap"
              style={{ color: showFilters ? '#055193' : '#212121' }}
            >
              <Filter size={18} />
              <span className="text-sm font-medium">Filters</span>
            </button>

            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg whitespace-nowrap"
              style={{ color: showMap ? '#055193' : '#212121' }}
            >
              <Map size={18} />
              <span className="text-sm font-medium">Map</span>
            </button>

            <div className="flex items-center gap-1 ml-auto bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: view === 'grid' ? '#055193' : '#212121' }}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
                style={{ color: view === 'list' ? '#055193' : '#212121' }}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Filter by Category</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedCategory === 'All'
                      ? 'text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                  style={selectedCategory === 'All' ? { backgroundColor: '#055193' } : {}}
                >
                  All
                </button>
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium text-left ${
                      selectedCategory === category
                        ? 'text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                    style={selectedCategory === category ? { backgroundColor: '#055193' } : {}}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {showMap && (
        <MapView listings={filteredListings} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#055193' }}
          >
            <option value="name">Sort by Name</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found matching your criteria.</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <ListingRow key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="h-48 bg-gray-200 overflow-hidden">
        <img
          src={listing.logo}
          alt={listing.businessName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="mb-2">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: '#055193' }}
          >
            {listing.category}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{listing.businessName}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="flex-shrink-0" />
            <span className="truncate">{listing.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="flex-shrink-0" />
            <span>{listing.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingRow({ listing, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
    >
      <div className="flex gap-4">
        <img
          src={listing.logo}
          alt={listing.businessName}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: '#055193' }}
            >
              {listing.category}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{listing.businessName}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{listing.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span className="truncate">{listing.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone size={14} />
              <span>{listing.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingDetail({ listing, onBack }) {
  const socialIcons = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    youtube: '📺',
    linkedin: '💼',
    tiktok: '🎵',
    yelp: '⭐',
    tripadvisor: '✈️',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <span>←</span>
            <span>Back to Listings</span>
          </button>
          <div className="flex items-center gap-3">
            <img 
              src="https://social.thegreekdirectory.org/Logo2.png" 
              alt="The Greek Directory" 
              className="h-12 w-auto"
            />
            <h1 className="text-xl font-bold" style={{ color: '#055193' }}>
              The Greek Directory
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="h-64 md:h-96 bg-gray-200">
            <img
              src={listing.logo}
              alt={listing.businessName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: '#055193' }}
            >
              {listing.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.businessName}</h1>
          <p className="text-gray-700 mb-6">{listing.description}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Address</p>
                <p className="text-gray-700">{listing.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={20} className="text-gray-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Phone</p>
                <a href={`tel:${listing.phone}`} className="text-blue-600 hover:underline">
                  {listing.phone}
                </a>
              </div>
            </div>

            {listing.email && (
              <div className="flex items-start gap-3">
                <Mail size={20} className="text-gray-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a href={`mailto:${listing.email}`} className="text-blue-600 hover:underline">
                    {listing.email}
                  </a>
                </div>
              </div>
            )}

            {listing.website && (
              <div className="flex items-start gap-3">
                <Globe size={20} className="text-gray-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Website</p>
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {listing.website}
                  </a>
                </div>
              </div>
            )}

            {listing.hours && (
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-gray-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Hours</p>
                  <p className="text-gray-700">{listing.hours}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <a
              href={`tel:${listing.phone}`}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium"
              style={{ backgroundColor: '#055193' }}
            >
              <Phone size={18} />
              <span>Call</span>
            </a>
            {listing.email && (
              <a
                href={`mailto:${listing.email}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium"
              >
                <Mail size={18} />
                <span>Email</span>
              </a>
            )}
            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium"
              >
                <Globe size={18} />
                <span>Visit Website</span>
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium"
            >
              <MapPin size={18} />
              <span>Directions</span>
            </a>
          </div>

          {listing.socialMedia && Object.keys(listing.socialMedia).length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Follow Us</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(listing.socialMedia).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span>{socialIcons[platform] || '🔗'}</span>
                    <span className="capitalize">{platform}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Listed By</h2>
          <p className="text-gray-700 font-medium">{listing.fullName}</p>
          {listing.fromGreece && (
            <p className="text-sm text-gray-600 mt-1">From {listing.fromGreece}, Greece</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MapView({ listings }) {
  const mapRef = React.useRef(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  React.useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 41.8781, lng: -87.6298 },
      zoom: 11,
    });

    const bounds = new window.google.maps.LatLngBounds();

    listings.forEach(async (listing) => {
      const geocoder = new window.google.maps.Geocoder();
      try {
        const result = await geocoder.geocode({ address: listing.address });
        if (result.results[0]) {
          const position = result.results[0].geometry.location;
          bounds.extend(position);

          const marker = new window.google.maps.Marker({
            position,
            map,
            title: listing.businessName,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #055193;">${listing.businessName}</h3>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${listing.category}</p>
                <p style="margin: 0; font-size: 12px;">${listing.address}</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    });

    if (listings.length > 0) {
      map.fitBounds(bounds);
    }
  }, [mapLoaded, listings]);

  return (
    <div className="h-96 border-b">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

export default App;
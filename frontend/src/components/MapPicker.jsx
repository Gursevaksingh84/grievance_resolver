import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Navigation, MapPin, Loader2, LocateFixed } from 'lucide-react'
import './MapPicker.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom blue pulse icon for current location
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div class="pulse-dot"><div class="pulse-ring"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Component to fly map to a specific position
const FlyToLocation = ({ position, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 15, { duration: 1.5 })
    }
  }, [position, zoom, map])
  return null
}

// Component to handle map click events
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationSelect({ lat, lng })
    },
  })
  return null
}

const MapPicker = ({ onLocationSelect: externalOnLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const [mode, setMode] = useState('manual') // 'manual' | 'current'

  // Reverse geocode lat/lng → address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()

      const address = data.address || {}
      return {
        lat,
        lng,
        address: data.display_name,
        state: address.state || '',
        city: address.city || address.town || address.village || '',
        district: address.county || address.state_district || '',
        pincode: address.postcode || '',
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return {
        lat,
        lng,
        address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
        state: '',
        city: '',
        district: '',
        pincode: '',
      }
    }
  }

  // Handle "Use Current Location" button
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setGeoLoading(true)
    setGeoError(null)
    setMode('current')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const loc = { lat: latitude, lng: longitude }

        setCurrentLocation(loc)
        setSelectedLocation(loc)
        setFlyTarget([latitude, longitude])

        // Reverse geocode
        const locationData = await reverseGeocode(latitude, longitude)
        setLocationName(locationData.address)

        if (externalOnLocationSelect) {
          externalOnLocationSelect(locationData)
        }

        setGeoLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        let msg = 'Unable to get your location.'
        if (error.code === 1) msg = 'Location permission denied. Please allow location access in your browser settings.'
        else if (error.code === 2) msg = 'Location unavailable. Please try again.'
        else if (error.code === 3) msg = 'Location request timed out. Please try again.'
        setGeoError(msg)
        setGeoLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Handle manual click on map
  const handleMapClick = async ({ lat, lng }) => {
    setMode('manual')
    setSelectedLocation({ lat, lng })
    setLocationName('Looking up address...')

    const locationData = await reverseGeocode(lat, lng)
    setLocationName(locationData.address)

    if (externalOnLocationSelect) {
      externalOnLocationSelect(locationData)
    }
  }

  return (
    <div className="map-picker">
      <h3>
        <MapPin size={20} />
        Select Location
      </h3>

      {/* Location mode buttons */}
      <div className="location-mode-buttons">
        <button
          type="button"
          className={`location-mode-btn current-btn ${geoLoading ? 'loading' : ''}`}
          onClick={handleUseCurrentLocation}
          disabled={geoLoading}
        >
          {geoLoading ? (
            <>
              <Loader2 size={16} className="spin-icon" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <LocateFixed size={16} />
              <span>Use My Current Location</span>
            </>
          )}
        </button>

        <div className="mode-divider">
          <span>or</span>
        </div>

        <p className="map-instructions">
          <MapPin size={14} />
          Click on the map to pin the complaint location manually
        </p>
      </div>

      {/* Error message */}
      {geoError && (
        <div className="geo-error">
          ⚠️ {geoError}
        </div>
      )}

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fly to target when location changes */}
          {flyTarget && <FlyToLocation position={flyTarget} zoom={16} />}

          {/* Click handler */}
          <MapClickHandler onLocationSelect={handleMapClick} />

          {/* Current location pulsing marker */}
          {currentLocation && mode === 'current' && (
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentLocationIcon}
            >
              <Popup>
                <div className="popup-content">
                  <strong>📍 Your Location</strong>
                  <br />
                  <small>{locationName || 'Detecting...'}</small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Selected location marker (manual click) */}
          {selectedLocation && mode === 'manual' && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>
                <div className="popup-content">
                  <strong>📌 Selected Location</strong>
                  <br />
                  <small>{locationName || 'Loading address...'}</small>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Selected location info */}
      {selectedLocation && locationName && locationName !== 'Looking up address...' && (
        <div className="selected-location-info">
          <div className="location-info-header">
            {mode === 'current' ? (
              <LocateFixed size={16} className="info-icon current" />
            ) : (
              <MapPin size={16} className="info-icon manual" />
            )}
            <strong>{mode === 'current' ? 'Current Location' : 'Selected Location'}</strong>
          </div>
          <p className="location-address">{locationName}</p>
          <p className="location-coords">
            {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
          </p>
        </div>
      )}
    </div>
  )
}

export default MapPicker

import React, { useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import ComplaintForm from '../components/ComplaintForm'
import MapPicker from '../components/MapPicker'
import SuccessMessage from '../components/SuccessMessage'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import './Home.css'

const Home = () => {
  const [submittedComplaint, setSubmittedComplaint] = useState(null)
  const [mapLocation, setMapLocation] = useState(null)
  const { t } = useTranslation()
  const auth = useAuth()
  const isAdmin = auth?.isAdmin || false

  // Redirect admin users to the Dashboard
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSuccess = (complaint) => {
    setSubmittedComplaint(complaint)
  }

  const handleReset = () => {
    setSubmittedComplaint(null)
  }

  const handleMapLocationSelect = (locationData) => {
    setMapLocation(locationData)
  }

  if (submittedComplaint) {
    return (
      <SuccessMessage 
        complaint={submittedComplaint} 
        onReset={handleReset}
      />
    )
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>{t('homeTitle')}</h1>
        <p className="subtitle">
          {t('homeSubtitle')}
        </p>
      </div>
      <div className="home-content">
        <div className="form-section">
          <ComplaintForm onSuccess={handleSuccess} mapLocation={mapLocation} />
        </div>
        <div className="map-section">
          <MapPicker onLocationSelect={handleMapLocationSelect} />
        </div>
      </div>
    </div>
  )
}

export default Home

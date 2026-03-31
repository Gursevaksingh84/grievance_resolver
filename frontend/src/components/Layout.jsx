import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, BarChart3, Globe, Map, MessageSquare, LogOut, User, LogIn } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { language, changeLanguage } = useLanguage()
  const { t } = useTranslation()
  
  // Get auth context - hooks must be called unconditionally
  const auth = useAuth()
  const user = auth?.user || null
  const isAdmin = auth?.isAdmin || false
  const signOut = auth?.signOut || (async () => ({ error: null }))

  const handleSignOut = async () => {
    try {
      console.log('🚪 Logout button clicked')
      const result = await signOut()
      console.log('📤 SignOut result:', result)
      if (result?.error) {
        console.error('❌ Logout error:', result.error)
      }
      console.log('🏠 Navigating to home page')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('❌ Sign out error in Layout:', error)
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to={isAdmin ? '/dashboard' : '/'} className="logo">
            <span className="logo-icon">🏛️</span>
            <div>
              <h1>{t('appName')}</h1>
              <p className="tagline">{t('tagline')}</p>
            </div>
          </Link>
          <nav className="nav">
            {!isAdmin && (
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <Home size={18} />
                <span>{t('navFileComplaint')}</span>
              </Link>
            )}
            <Link 
              to="/status" 
              className={`nav-link ${location.pathname.startsWith('/status') ? 'active' : ''}`}
            >
              <Search size={18} />
              <span>{t('navCheckStatus')}</span>
            </Link>
            {isAdmin && (
              <Link 
                to="/dashboard" 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <BarChart3 size={18} />
                <span>{t('navDashboard')}</span>
              </Link>
            )}
            <Link 
              to="/heatmap" 
              className={`nav-link ${location.pathname === '/heatmap' ? 'active' : ''}`}
            >
              <Map size={18} />
              <span>{t('navHeatmap') || 'Heatmap'}</span>
            </Link>
            <Link 
              to="/forums" 
              className={`nav-link ${location.pathname.startsWith('/forum') ? 'active' : ''}`}
            >
              <MessageSquare size={18} />
              <span>{t('navForums') || 'Forums'}</span>
            </Link>
            
            {/* User Menu */}
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <User size={16} />
                  <span className="user-email">{user.email}</span>
                  {isAdmin && <span className="user-badge">Admin</span>}
                </div>
                <button onClick={handleSignOut} className="logout-button" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="nav-link">
                <LogIn size={18} />
                <span>{t('login') || 'Login'}</span>
              </Link>
            )}
            
            {/* Language Selector */}
            <div className="language-selector-header">
              <Globe size={16} />
              <select 
                value={language} 
                onChange={(e) => changeLanguage(e.target.value)}
                className="language-select-header"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
          </nav>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
      </footer>
    </div>
  )
}

export default Layout


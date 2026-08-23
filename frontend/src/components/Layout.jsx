import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Search, BarChart3, Globe, Map, MessageSquare,
  LogOut, User, LogIn, FileText,
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { language, changeLanguage } = useLanguage()
  const { t } = useTranslation()

  // Auth — hooks must be called unconditionally
  const auth = useAuth()
  const user = auth?.user || null
  const isAdmin = auth?.isAdmin || false
  const signOut = auth?.signOut || (async () => ({ error: null }))

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result?.error) console.error('❌ Logout error:', result.error)
      navigate('/', { replace: true })
    } catch (error) {
      console.error('❌ Sign out error in Layout:', error)
      navigate('/', { replace: true })
    }
  }

  // Helper: is the current path exactly this route or a sub-route of it?
  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          {/* Logo */}
          <Link to={isAdmin ? '/dashboard' : '/home'} className="logo">
            <span className="logo-icon">🏛️</span>
            <div>
              <h1>{t('appName')}</h1>
              <p className="tagline">{t('tagline')}</p>
            </div>
          </Link>

          <nav className="nav">
            {/* ── Citizen-only links ──────────────────────────── */}
            {!isAdmin && (
              <Link
                to="/home"
                className={`nav-link ${isActive('/home', true) ? 'active' : ''}`}
              >
                <Home size={18} />
                <span>{t('navFileComplaint')}</span>
              </Link>
            )}

            {/* Check Status — visible to everyone */}
            <Link
              to="/status"
              className={`nav-link ${isActive('/status') ? 'active' : ''}`}
            >
              <Search size={18} />
              <span>{t('navCheckStatus')}</span>
            </Link>

            {/* ── Admin-only links ────────────────────────────── */}
            {isAdmin && (
              <>
                {/* Dashboard — overview KPIs + live feed */}
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard', true) ? 'active' : ''}`}
                >
                  <BarChart3 size={18} />
                  <span>{t('navDashboard') || 'Dashboard'}</span>
                </Link>

                {/* Complaints — full operational list */}
                <Link
                  to="/complaints"
                  className={`nav-link ${isActive('/complaints') ? 'active' : ''}`}
                >
                  <FileText size={18} />
                  <span>Complaints</span>
                </Link>
              </>
            )}

            {/* Heatmap — visible to everyone */}
            <Link
              to="/heatmap"
              className={`nav-link ${isActive('/heatmap', true) ? 'active' : ''}`}
            >
              <Map size={18} />
              <span>{t('navHeatmap') || 'Heatmap'}</span>
            </Link>

            {/* Forums — visible to everyone */}
            <Link
              to="/forums"
              className={`nav-link ${isActive('/forum') ? 'active' : ''}`}
            >
              <MessageSquare size={18} />
              <span>{t('navForums') || 'Forums'}</span>
            </Link>

            {/* ── User menu / login ───────────────────────────── */}
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

            {/* ── Language selector ───────────────────────────── */}
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

      {/*
        main-content: regular pages get the standard centered container.
        Admin shell pages (/dashboard, /complaints) opt out of the max-width
        container by NOT wrapping their content in <Layout> — OR you can
        add the class "main-content--full" to the shell wrapper and keep
        using Layout. See README comment below.
      */}
      <main className="main-content">
        {children}
      </main>

      <footer className="footer" />
    </div>
  )
}

export default Layout

/*
─────────────────────────────────────────────────────────────
ROUTING NOTES (App.jsx / router setup)
─────────────────────────────────────────────────────────────

Option A — GrievanceAdminShell manages its own full-viewport layout
(RECOMMENDED — it already has height:100vh + sticky topbar):

  import GrievanceAdminShell from './pages/GrievanceAdminShell'

  // These routes do NOT wrap in <Layout> — the shell IS the layout
  <Route path="/dashboard"  element={<ProtectedAdminRoute><GrievanceAdminShell defaultPage="dashboard"  /></ProtectedAdminRoute>} />
  <Route path="/complaints" element={<ProtectedAdminRoute><GrievanceAdminShell defaultPage="complaints" /></ProtectedAdminRoute>} />

  // All other routes use <Layout> as normal
  <Route path="/" element={<Layout><HomePage /></Layout>} />

Option B — If you want Layout's topbar on admin pages too,
add the "admin" prop and override main-content padding in CSS:

  <main className={`main-content${isAdmin ? ' main-content--admin' : ''}`}>
  // In Layout.css:
  .main-content--admin { max-width: 100%; padding: 0; }

─────────────────────────────────────────────────────────────
PASSING defaultPage to GrievanceAdminShell
─────────────────────────────────────────────────────────────

In GrievanceAdminShell.jsx, accept the prop and use it as initial state:

  const GrievanceAdminShell = ({ defaultPage = 'dashboard' }) => {
    const [page, setPage] = useState(defaultPage)
    ...
  }

This way /dashboard opens the Dashboard view and /complaints opens
the Complaints view directly, while internal navigation still works.
*/
import { useState } from 'react'
import { ArrowUpRight, Boxes, CalendarDays, ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Shield, Shirt, Sparkles, Sun, Tags, UserRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useTheme } from '../context'

const navigation = [
  { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/wardrobe', label: 'My wardrobe', icon: Shirt },
  { to: '/app/categories', label: 'Categories', icon: Tags },
  { to: '/app/outfits', label: 'Outfits', icon: Boxes },
  { to: '/app/planner', label: 'Wear & plan', icon: CalendarDays },
  { to: '/app/profile', label: 'Profile & security', icon: UserRound },
]
const titles: Record<string, string> = { '/app/dashboard': 'Overview', '/app/wardrobe': 'My wardrobe', '/app/categories': 'Categories', '/app/outfits': 'Outfit planner', '/app/planner/wear': 'Wear', '/app/planner/plan': 'Plan', '/app/planner': 'Wear & plan', '/app/profile': 'Profile & security', '/app/admin/users': 'Manage users' }

function Brand() {
  return <Link className="brand-lockup" to="/"><span className="brand-mark"><Shirt size={17} strokeWidth={1.7} aria-hidden="true" /></span><span>Digital Wardrobe</span></Link>
}

export default function AppLayout() {
  const location = useLocation()
  const isPlannerRoute = location.pathname.startsWith('/app/planner')
  const [menuOpen, setMenuOpen] = useState(false)
  const [plannerExpandedOverride, setPlannerExpandedOverride] = useState<boolean | null>(null)
  const plannerExpanded = plannerExpandedOverride ?? isPlannerRoute
  const [logoutError, setLogoutError] = useState('')
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const visibleNavigation = user?.role === 'admin'
    ? [...navigation, { to: '/app/admin/users', label: 'Manage users', icon: Shield }]
    : navigation
  const title = titles[location.pathname] ?? (location.pathname.includes('/wardrobe/') ? 'Clothing details' : 'Your wardrobe')

  async function signOut() {
    setLogoutError('')
    try {
      await logout()
    } catch {
      setLogoutError('Could not confirm sign out with the service. Your local session has been cleared.')
    }
  }

  return <div className="app-shell">
    {menuOpen && <button className="sidebar-scrim" type="button" aria-label="Dismiss navigation overlay" onClick={() => setMenuOpen(false)} />}
    <aside id="workspace-navigation" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Application navigation">
      <Brand />
      <span className="sidebar-label">Workspace</span>
      <nav className="sidebar-nav">
        {visibleNavigation.map(({ to, label, icon: Icon }) => label === 'Wear & plan' ? (
          <div className="sidebar-nav-group" key={to}>
            <button
              className={`sidebar-nav-group-toggle ${isPlannerRoute ? 'is-active' : ''}`}
              type="button"
              aria-expanded={plannerExpanded}
              aria-controls="planner-navigation"
              onClick={() => setPlannerExpandedOverride(!plannerExpanded)}
            >
              <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
              <span>{label}</span>
              <ChevronDown className={`sidebar-nav-chevron ${plannerExpanded ? 'is-open' : ''}`} size={15} aria-hidden="true" />
            </button>
            {plannerExpanded && (
              <div className="sidebar-subnav" id="planner-navigation">
                <NavLink to="/app/planner/wear" onClick={() => setMenuOpen(false)}>Wear</NavLink>
                <NavLink to="/app/planner/plan" onClick={() => setMenuOpen(false)}>Plan</NavLink>
              </div>
            )}
          </div>
        ) : (
          <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="eyebrow"><Sparkles size={13} aria-hidden="true" /> Make room for style</span>
        <Link to="/" aria-label="Return to public home">Back to home <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
    </aside>
    <div className="app-main"><header className="app-topbar"><div className="topbar-title"><button className="topbar-icon-button mobile-menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button><div><span className="topbar-kicker">Digital Wardrobe</span><h1>{title}</h1></div></div><div className="topbar-tools"><button type="button" className="theme-toggle-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><span className="topbar-user"><span className="user-initial" aria-hidden="true">{user?.name.slice(0, 1).toUpperCase()}</span><span>{user?.name}</span></span><button className="button-secondary button-small" type="button" onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div></header><main className="app-content">{logoutError && <p className="form-error" role="alert">{logoutError}</p>}<Outlet /></main></div>
  </div>
}
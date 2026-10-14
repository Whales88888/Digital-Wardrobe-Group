import { useState } from 'react'
import { ArrowUpRight, Boxes, CalendarDays, LayoutDashboard, LogOut, Menu, Shirt, Sparkles, Tags, UserRound, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const navigation = [
  { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/wardrobe', label: 'My wardrobe', icon: Shirt },
  { to: '/app/categories', label: 'Categories', icon: Tags },
  { to: '/app/outfits', label: 'Outfits', icon: Boxes },
  { to: '/app/planner', label: 'Wear & plan', icon: CalendarDays },
  { to: '/app/profile', label: 'Profile & security', icon: UserRound },
]
const titles: Record<string, string> = { '/app/dashboard': 'Overview', '/app/wardrobe': 'My wardrobe', '/app/categories': 'Categories', '/app/outfits': 'Outfit planner', '/app/planner': 'Wear & plan', '/app/profile': 'Profile & security' }

function Brand() {
  return <Link className="brand-lockup" to="/"><span className="brand-mark"><Shirt size={17} strokeWidth={1.7} aria-hidden="true" /></span><span>Digital Wardrobe</span></Link>
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const location = useLocation()
  const { user, logout } = useAuth()
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
    <aside id="workspace-navigation" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Application navigation"><Brand /><span className="sidebar-label">Workspace</span><nav className="sidebar-nav">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}><Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><span className="eyebrow"><Sparkles size={13} aria-hidden="true" /> Make room for style</span><Link to="/" aria-label="Return to public home">Back to home <ArrowUpRight size={14} aria-hidden="true" /></Link></div></aside>
    <div className="app-main"><header className="app-topbar"><div className="topbar-title"><button className="topbar-icon-button mobile-menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button><div><span className="topbar-kicker">Digital Wardrobe</span><h1>{title}</h1></div></div><div className="topbar-tools"><span className="topbar-user"><span className="user-initial" aria-hidden="true">{user?.name.slice(0, 1).toUpperCase()}</span><span>{user?.name}</span></span><button className="button-secondary button-small" type="button" onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div></header><main className="app-content">{logoutError && <p className="form-error" role="alert">{logoutError}</p>}<Outlet /></main></div>
  </div>
}
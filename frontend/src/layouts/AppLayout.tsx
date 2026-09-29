import { useState } from 'react'
import { ArrowUpRight, Boxes, LayoutDashboard, Menu, Shirt, Sparkles, Tags, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navigation = [
  { to: '/app/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/wardrobe', label: 'My wardrobe', icon: Shirt },
  { to: '/app/categories', label: 'Categories', icon: Tags },
  { to: '/app/outfits', label: 'Outfits', icon: Boxes },
]
const titles: Record<string, string> = { '/app/dashboard': 'Overview', '/app/wardrobe': 'My wardrobe', '/app/categories': 'Categories', '/app/outfits': 'Outfit planner' }

function Brand() {
  return <Link className="brand-lockup" to="/"><span className="brand-mark"><Shirt size={17} strokeWidth={1.7} aria-hidden="true" /></span><span>Digital Wardrobe</span></Link>
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] ?? (location.pathname.includes('/wardrobe/') ? 'Clothing details' : 'Your wardrobe')

  return <div className="app-shell">
    {menuOpen && <button className="sidebar-scrim" type="button" aria-label="Dismiss navigation overlay" onClick={() => setMenuOpen(false)} />}
    <aside id="workspace-navigation" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Application navigation"><Brand /><span className="sidebar-label">Workspace</span><nav className="sidebar-nav">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}><Icon size={17} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><span className="eyebrow"><Sparkles size={13} aria-hidden="true" /> Make room for style</span><Link to="/" aria-label="Return to public home">Back to home <ArrowUpRight size={14} aria-hidden="true" /></Link></div></aside>
    <div className="app-main"><header className="app-topbar"><div className="topbar-title"><button className="topbar-icon-button mobile-menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button><div><span className="topbar-kicker">Digital Wardrobe</span><h1>{title}</h1></div></div><div className="topbar-tools"><span className="topbar-user"><span className="user-initial" aria-hidden="true">DW</span><span>Wardrobe workspace</span></span></div></header><main className="app-content"><Outlet /></main></div>
  </div>
}
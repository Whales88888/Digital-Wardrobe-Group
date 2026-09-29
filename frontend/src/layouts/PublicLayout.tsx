import { ArrowRight, Shirt } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

function Brand() {
  return <Link className="brand-lockup" to="/" aria-label="Digital Wardrobe home"><span className="brand-mark"><Shirt size={17} strokeWidth={1.7} aria-hidden="true" /></span><span>Digital Wardrobe</span></Link>
}

export default function PublicLayout() {
  return <><header className="public-header"><Brand /><nav className="public-nav" aria-label="Main navigation"><a href="/#collection">The collection</a><a href="/#approach">Our approach</a><Link to="/about">About</Link><Link className="nav-cta" to="/app/wardrobe">Explore wardrobe <ArrowRight size={14} aria-hidden="true" /></Link></nav></header><Outlet /><footer className="public-footer"><Brand /><Link to="/about">About Digital Wardrobe</Link><p>Thoughtful style begins with what you own.</p><span>Digital Wardrobe · 2026</span></footer></>
}
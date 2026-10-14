import { useState } from 'react'
import { ArrowRight, Menu, Moon, Shirt, Sun, X } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useTheme } from '../context'

function Brand() {
  return (
    <Link className="brand-lockup" to="/" aria-label="Digital Wardrobe home">
      <span className="brand-mark">
        <Shirt size={17} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span>Digital Wardrobe</span>
    </Link>
  )
}

export default function PublicLayout() {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="public-header">
        <Brand />
        <nav className="public-nav" aria-label="Main navigation">
          <a href="/#approach">Our approach</a>
          <Link to="/about">About</Link>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {isAuthenticated ? (
            <Link className="nav-cta" to="/app/wardrobe">
              My wardrobe <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="nav-cta" to="/register">
                Create account <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </>
          )}
        </nav>
        <div className="public-mobile-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="mobile-public-toggle"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-public-drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <nav className="mobile-public-nav">
            <a href="/#approach" onClick={() => setMobileMenuOpen(false)}>
              Our approach
            </a>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
              About Digital Wardrobe
            </Link>
            <hr className="mobile-divider" />
            {isAuthenticated ? (
              <Link className="button-primary" to="/app/wardrobe" onClick={() => setMobileMenuOpen(false)}>
                My wardrobe <ArrowRight size={15} />
              </Link>
            ) : (
              <div className="mobile-auth-links">
                <Link className="button-secondary" to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
                <Link className="button-primary" to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Create account <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      <Outlet />

      <footer className="public-footer">
        <Brand />
        <Link to="/about">About Digital Wardrobe</Link>
        <p>Thoughtful style begins with what you own.</p>
        <span>Digital Wardrobe · 2026</span>
      </footer>
    </>
  )
}
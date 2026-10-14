import { ArrowRight, Compass, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <div className="not-found-icon">
          <Compass size={42} strokeWidth={1.5} />
        </div>
        <h1>Lost in the wardrobe?</h1>
        <p>
          The page you are looking for doesn't exist, has been moved, or is no longer available.
        </p>
        <div className="not-found-actions">
          <Link className="button-primary" to={isAuthenticated ? '/app/dashboard' : '/'}>
            {isAuthenticated ? (
              <>
                <Home size={16} /> Return to overview
              </>
            ) : (
              <>
                <Home size={16} /> Return to homepage
              </>
            )}
          </Link>
          {isAuthenticated && (
            <Link className="button-secondary" to="/app/wardrobe">
              Open my wardrobe <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}

import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import styles from './PublicLayout.module.css'

const NAV_LINKS = [
  { label: 'Home',     to: ROUTES.HOME },
  { label: 'About',    to: ROUTES.ABOUT },
  { label: 'Services', to: ROUTES.SERVICES },
  { label: 'Blog',     to: ROUTES.BLOG },
  { label: 'Products', to: ROUTES.PRODUCTS },
  { label: 'Contact',  to: ROUTES.CONTACT },
]

export default function PublicLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            🏥 <span>HMS Hospital</span>
          </Link>

          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <Link to={ROUTES.LOGIN} className={styles.ctaBtn} id="public-login-btn">
            Patient Login
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© {new Date().getFullYear()} HMS Hospital. All rights reserved.</p>
          <p>
            🏥 We care for your health — every branch, every day.
          </p>
        </div>
      </footer>
    </div>
  )
}

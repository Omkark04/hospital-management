import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import styles from './DashboardLayout.module.css'

/**
 * Shared dashboard shell: fixed sidebar + fixed topbar + scrollable main.
 * All role dashboards use this layout.
 */
export default function DashboardLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.right}>
        <Topbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Bell } from 'lucide-react'
import AvatarMenu from '@/components/shared/AvatarMenu'
import styles from './Topbar.module.css'

export function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {/* Page title is rendered by each page — topbar stays minimal */}
        <span className={styles.brand}>HMS</span>
      </div>

      <div className={styles.right}>
        {/* Notifications bell */}
        <button className={styles.iconBtn} aria-label="Notifications" id="topbar-notifications">
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>

        {/* User avatar + dropdown */}
        <AvatarMenu />
      </div>
    </header>
  )
}

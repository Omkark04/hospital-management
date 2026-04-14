import { useAuthStore } from '@/app/store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Badge } from '@/components/ui'
import { ROLE_LABELS } from '@/config/roles'
import styles from './AvatarMenu.module.css'
import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'

export default function AvatarMenu() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const { role } = usePermissions()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) return null

  const initials = `${user.full_name?.charAt(0) ?? '?'}`.toUpperCase()

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        id="avatar-menu-trigger"
      >
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.info}>
          <span className={styles.name}>{user.full_name}</span>
          <Badge variant={role === 'owner' ? 'primary' : 'neutral'} size="sm">
            {role ? ROLE_LABELS[role] : 'User'}
          </Badge>
        </div>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <p className={styles.dropdownName}>{user.full_name}</p>
            <p className={styles.dropdownEmail}>{user.email}</p>
          </div>

          <div className={styles.dropdownDivider} />

          <button className={styles.dropdownItem} role="menuitem">
            <User size={15} />
            My Profile
          </button>
          <button className={styles.dropdownItem} role="menuitem">
            <Settings size={15} />
            Settings
          </button>

          <div className={styles.dropdownDivider} />

          <button
            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
            role="menuitem"
            onClick={() => { setOpen(false); logout() }}
            id="logout-btn"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

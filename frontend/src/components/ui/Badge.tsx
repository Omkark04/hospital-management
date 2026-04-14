import { clsx } from 'clsx'
import styles from './Badge.module.css'

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  dot?: boolean
  className?: string
}

export function Badge({ children, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[variant], className)}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  )
}

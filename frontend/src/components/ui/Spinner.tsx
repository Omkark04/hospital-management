import { clsx } from 'clsx'
import styles from './Spinner.module.css'

type Size = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?: Size
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Loading…', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx(styles.spinner, styles[size], className)}
    />
  )
}

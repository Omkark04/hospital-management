import type { InputHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {props.required && <span className={styles.required} aria-hidden>*</span>}
        </label>
      )}

      <div className={clsx(styles.inputWrap, error && styles.hasError)}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={inputId}
          className={clsx(styles.input, leftIcon && styles.hasLeftIcon, rightIcon && styles.hasRightIcon, className)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>

      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">{error}</p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className={styles.hint}>{hint}</p>
      )}
    </div>
  )
}

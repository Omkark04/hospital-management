import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import styles from './LoginForm.module.css'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const { login, isLoggingIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginFormData) => login(data)

  return (
    <div className={styles.page}>
      {/* Decorative blobs */}
      <div className={styles.blob1} aria-hidden />
      <div className={styles.blob2} aria-hidden />

      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>🏥</div>
          <h1 className={styles.brandName}>HMS</h1>
          <p className={styles.brandTagline}>Hospital Management System</p>
        </div>

        <h2 className={styles.title}>Sign in to your account</h2>
        <p className={styles.subtitle}>
          Enter your credentials to access your dashboard
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input
            label="Email address"
            type="email"
            id="login-email"
            placeholder="doctor@hospital.com"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            id="login-password"
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
          />

          <Button
            type="submit"
            id="login-submit"
            fullWidth
            size="lg"
            isLoading={isLoggingIn}
          >
            {isLoggingIn ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className={styles.footer}>
          Need help? Contact your administrator.
        </p>
      </div>
    </div>
  )
}

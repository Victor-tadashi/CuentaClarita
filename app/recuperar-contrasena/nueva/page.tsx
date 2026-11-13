import type { Metadata } from 'next'
import { PasswordRecoveryUpdate } from '@/features/auth/password-recovery'

export const metadata: Metadata = {
  title: 'Crear nueva contraseña | CuentaClarita',
  description: 'Establece una nueva contraseña para tu cuenta de CuentaClarita.',
  robots: { index: false, follow: false },
}

export default function NewPasswordPage() {
  return <PasswordRecoveryUpdate />
}

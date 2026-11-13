import type { Metadata } from 'next'
import { PasswordRecoveryRequest } from '@/features/auth/password-recovery'

export const metadata: Metadata = {
  title: 'Recuperar contraseña | CuentaClarita',
  description: 'Solicita un enlace seguro para recuperar el acceso a tu cuenta de CuentaClarita.',
  robots: { index: false, follow: false },
}

export default function RecoverPasswordPage() {
  return <PasswordRecoveryRequest />
}

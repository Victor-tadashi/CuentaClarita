import type { Metadata } from 'next'
import { PasswordRecoveryUpdate } from '@/features/auth/password-recovery'
import { createClient } from '@/lib/supabase/server'
import { getRecoveryGrantForCurrentSession } from '@/lib/supabase/recovery-grant'

export const metadata: Metadata = {
  title: 'Crear nueva contraseña | CuentaClarita',
  description: 'Establece una nueva contraseña para tu cuenta de CuentaClarita.',
  robots: { index: false, follow: false },
}

export default async function NewPasswordPage() {
  const supabase = await createClient()
  const recoveryGrant = await getRecoveryGrantForCurrentSession(supabase)

  return <PasswordRecoveryUpdate recoveryGrant={recoveryGrant} />
}

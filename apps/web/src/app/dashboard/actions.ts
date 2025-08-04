'use server'

import { clearSession } from '@/lib/auth/magic-link'
import { redirect } from 'next/navigation'

export async function signOut() {
  await clearSession()
  redirect('/')
}
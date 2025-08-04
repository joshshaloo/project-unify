'use server'

import { registerUser as registerUserAction } from '@/lib/auth/actions'

export async function registerUser(prevState: any, formData: FormData) {
  return registerUserAction(prevState, formData)
}
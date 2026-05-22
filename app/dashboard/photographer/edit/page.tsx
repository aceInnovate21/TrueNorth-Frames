'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProfileRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/photographer?tab=settings')
  }, [router])
  return null
}

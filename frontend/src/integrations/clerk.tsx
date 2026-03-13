import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/react'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const enableClerk = import.meta.env.VITE_ENABLE_CLERK === 'true'

export const clerkEnabled = Boolean(enableClerk && publishableKey)

export function OptionalClerkProvider({ children }: { children: ReactNode }) {
  if (!clerkEnabled || !publishableKey) {
    return <>{children}</>
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  )
}

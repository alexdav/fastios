import { redirect } from 'next/navigation'

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side check for development mode
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Redirect to home if not in development
  if (!isDevelopment) {
    redirect('/')
  }

  return <>{children}</>
}
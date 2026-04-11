import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { DialerWidget } from "@/components/dialer-widget"

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  return verifyToken(token)
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser()

  const user = session
    ? { name: session.name, email: session.email, role: session.role }
    : undefined

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="min-h-screen">
        <DashboardHeader />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
      <DialerWidget />
    </SidebarProvider>
  )
}

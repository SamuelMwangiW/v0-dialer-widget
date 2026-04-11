"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const breadcrumbMap: Record<string, { label: string; parent?: { label: string; href: string } }> = {
  "/": { label: "Overview" },
  "/calls": { label: "Call History" },
  "/contacts": { label: "Contacts" },
  "/agents": { label: "Agents" },
}

function getBreadcrumb(pathname: string) {
  // Check for dynamic contact detail pages
  if (pathname.match(/^\/contacts\/\d+$/)) {
    return {
      label: "Contact Detail",
      parent: { label: "Contacts", href: "/contacts" },
    }
  }
  return breadcrumbMap[pathname] || { label: "Dashboard" }
}

export function DashboardHeader() {
  const pathname = usePathname()
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-4 mr-1" />

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.parent ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={breadcrumb.parent.href} className="text-muted-foreground hover:text-foreground">
                  {breadcrumb.parent.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{breadcrumb.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{breadcrumb.label}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>
    </header>
  )
}

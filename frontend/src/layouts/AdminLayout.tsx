import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  LayoutDashboard, Calendar, Users, UserCheck, Vote, LogOut, Moon, Palette, Bell, Plus
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import React from 'react'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/events', label: 'Events', icon: Calendar },
  { to: '/admin/candidates', label: 'Candidates', icon: Users },
  { to: '/admin/voters', label: 'Voters', icon: UserCheck },
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const paths = location.pathname.split('/').filter(Boolean)

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 flex items-center justify-center px-4">
          <Link to="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Vote className="h-4 w-4" />
            </div>
            <span className="text-lg tracking-tight group-data-[collapsible=icon]:hidden">Go-Vote</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.to)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton isActive={isActive} tooltip={item.label} onClick={() => navigate(item.to)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList className="text-sm text-muted-foreground">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink onClick={() => navigate('/admin/dashboard')} className="cursor-pointer hover:text-foreground transition-colors">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {paths.slice(1).map((path, idx, arr) => {
                  const isLast = idx === arr.length - 1
                  const text = path.charAt(0).toUpperCase() + path.slice(1)
                  return (
                    <React.Fragment key={path}>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="font-medium text-foreground">{text}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink onClick={() => navigate(`/admin/${paths.slice(1, idx + 2).join('/')}`)} className="cursor-pointer hover:text-foreground transition-colors">
                            {text}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vote')} title="Public Voting Page" className="text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors">
              <Vote className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarFallback className="rounded-md bg-primary/10 text-primary font-semibold">
                {admin?.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout} title="Log out" className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 pb-0 max-w-full mx-auto w-full flex flex-col relative">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

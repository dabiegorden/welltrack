"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Signal,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const adminMenu = [
  {
    title: "Overview",
    url: "/admin-dashboard",
    icon: BarChart3,
  },
  {
    title: "Management",
    items: [
      {
        title: "Users",
        url: "/admin-dashboard/users",
        icon: Users,
      },
      {
        title: "Counselors",
        url: "/admin-dashboard/counselors",
        icon: User,
      },
      {
        title: "Appointments",
        url: "/admin-dashboard/appointments",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Wellness",
    items: [
      {
        title: "Assessments",
        url: "/admin-dashboard/assessments",
        icon: Signal,
      },
      {
        title: "Resources",
        url: "/admin-dashboard/resources",
        icon: BookOpen,
      },
      {
        title: "Reports & Analytics",
        url: "/admin-dashboard/reports",
        icon: TrendingUp,
      },
    ],
  },
];

export const officerMenu = [
  {
    title: "Dashboard",
    url: "/admin-dashboard",
    icon: BarChart3,
  },
  {
    title: "Wellness",
    items: [
      {
        title: "Stress Assessment",
        url: "/admin-dashboard/assessments",
        icon: Signal,
      },
      // {
      //   title: "My Progress",
      //   url: "/admin-dashboard/progress",
      //   icon: TrendingUp,
      // },
    ],
  },
  {
    title: "Support",
    items: [
      {
        title: "Book Counseling",
        url: "/admin-dashboard/counseling",
        icon: Calendar,
      },
      {
        title: "Peer Forum",
        url: "/admin-dashboard/forum",
        icon: MessageSquare,
      },
    ],
  },
  // {
  //   title: "Resources",
  //   items: [
  //     {
  //       title: "Wellness Library",
  //       url: "/admin-dashboard/resources",
  //       icon: FileText,
  //     },
  //   ],
  // },
];

export const counselorMenu = [
  {
    title: "Dashboard",
    url: "/admin-dashboard",
    icon: BarChart3,
  },
  {
    title: "Counseling",
    items: [
      {
        title: "Appointments",
        url: "/admin-dashboard/counselor/appointments",
        icon: Calendar,
      },
      // {
      //   title: "Assigned Officers",
      //   url: "/admin-dashboard/counselor/officers",
      //   icon: Users,
      // },
      // {
      //   title: "Session Notes",
      //   url: "/admin-dashboard/counselor/notes",
      //   icon: FileText,
      // },
    ],
  },
  // {
  //   title: "Resources",
  //   items: [
  //     {
  //       title: "Wellness Materials",
  //       url: "/admin-dashboard/counselor/resources",
  //       icon: BookOpen,
  //     },
  //   ],
  // },
];

export function getSidebarMenu(role: "admin" | "officer" | "counselor") {
  switch (role) {
    case "admin":
      return adminMenu;
    case "counselor":
      return counselorMenu;
    default:
      return officerMenu;
  }
}

export default function AppSidebar({
  role,
}: {
  role: "admin" | "officer" | "counselor";
}) {
  const pathname = usePathname();
  const menuItems = getSidebarMenu(role);

  return (
    <Sidebar>
      <SidebarHeader className="p-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3 pt-16">
          <div className="w-11 h-11 bg-linear-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 duration-300">
            <span className="text-white font-bold text-lg">WT</span>
          </div>
          <div>
            <h2 className="font-bold text-white text-base tracking-tight">
              WellTrack
            </h2>
            <p className="text-xs text-gray-400 capitalize font-medium">
              {role} Portal
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent py-3">
        {menuItems.map((item, index) => (
          <SidebarGroup key={index} className="px-3">
            {item.title && !item.items && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="w-full hover:bg-gray-800/50 hover:text-white data-[active=true]:bg-linear-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-600 text-gray-400 data-[active=true]:text-white transition-all duration-300 rounded-xl shadow-lg data-[active=true]:shadow-blue-500/20 hover:translate-x-1"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-semibold text-sm">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}

            {item.items && (
              <>
                <SidebarGroupLabel className="text-gray-500 text-[11px] font-bold uppercase tracking-widest px-4 py-3 mt-4 mb-1">
                  {item.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(subItem.url)}
                          className="hover:bg-gray-800/50 hover:text-white data-[active=true]:bg-linear-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-600 text-gray-400 data-[active=true]:text-white transition-all duration-300 rounded-xl shadow-lg data-[active=true]:shadow-blue-500/20 hover:translate-x-1"
                        >
                          <Link
                            href={subItem.url}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <subItem.icon className="w-5 h-5 shrink-0" />
                            <span className="font-medium text-sm">
                              {subItem.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

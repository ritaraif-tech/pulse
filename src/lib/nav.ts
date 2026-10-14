import {
  CalendarCheck,
  ChartLine,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  PersonStanding,
  Ruler,
  Settings,
} from "lucide-react"

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/check-in", label: "Check-in", icon: CalendarCheck },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/body-changes", label: "Body changes", icon: PersonStanding },
  { href: "/trends", label: "Trends", icon: ChartLine },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
]

/** usePathname() keeps the trailing slash from `trailingSlash: true` */
export const normalizePath = (path: string) =>
  path.length > 1 ? path.replace(/\/$/, "") : path

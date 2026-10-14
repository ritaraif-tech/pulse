import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function StatCard({
  label,
  value,
  delta,
  deltaUnit = "",
  footer,
  children,
}: {
  label: string
  value: string
  /** Change vs the previous period; omitted when there's nothing to compare */
  delta?: number | null
  deltaUnit?: string
  footer?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        {delta != null && delta !== 0 && (
          <CardAction>
            <Badge variant={delta > 0 ? "secondary" : "outline"}>
              {delta > 0 ? <TrendingUp /> : <TrendingDown />}
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}
              {deltaUnit}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {children}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

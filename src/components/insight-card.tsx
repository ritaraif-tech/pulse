import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { insightCategoryLabels, type Insight } from "@/lib/analytics"

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{insight.title}</CardTitle>
        <CardDescription>{insight.description}</CardDescription>
        <CardAction>
          <Badge
            variant={
              insight.tone === "positive"
                ? "secondary"
                : insight.tone === "negative"
                  ? "destructive"
                  : "outline"
            }
          >
            {insight.tone === "positive" ? (
              <TrendingUp />
            ) : insight.tone === "negative" ? (
              <TrendingDown />
            ) : (
              <Lightbulb />
            )}
            {insightCategoryLabels[insight.category]}
          </Badge>
        </CardAction>
      </CardHeader>
    </Card>
  )
}

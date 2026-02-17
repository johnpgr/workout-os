import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeeklyVolumeQuery } from "@/features/progress/queries"

export function VolumeTrendChart() {
  const volumeQuery = useWeeklyVolumeQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tendência de Carga de Volume</CardTitle>
      </CardHeader>
      <CardContent>
        {!volumeQuery.trend.length ? (
          <p className="text-sm text-muted-foreground">Sem dados de tendência ainda.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={volumeQuery.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="volumeLoad"
                  name="Carga de volume"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

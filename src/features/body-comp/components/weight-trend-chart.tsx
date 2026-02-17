import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWeightLogsQuery } from "@/features/body-comp/queries"
import { calculateMovingAverage } from "@/features/body-comp/types"

export function WeightTrendChart() {
  const weightQuery = useWeightLogsQuery()
  const logs = weightQuery.data ?? []

  const maData = calculateMovingAverage(logs, 7)

  const chartData = logs.map((log) => ({
    date: log.date,
    weight: log.weightKg,
    movingAverage: maData.find((entry) => entry.date === log.date)?.average ?? log.weightKg,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tendência de peso (MM 7d)</CardTitle>
      </CardHeader>
      <CardContent>
        {!chartData.length ? (
          <p className="text-sm text-muted-foreground">Sem registros de peso.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" name="Peso" stroke="var(--color-chart-3)" dot={false} />
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  name="Média móvel (7d)"
                  stroke="var(--color-chart-1)"
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

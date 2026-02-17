import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProgressSessionsQuery } from "@/features/progress/queries"
import { getBestE1RMForExercise } from "@/features/progress/e1rm-utils"

export function E1RMChart() {
  const sessionsQuery = useProgressSessionsQuery()

  const names = new Set<string>()
  for (const session of sessionsQuery.data ?? []) {
    for (const set of session.sets) {
      names.add(set.exerciseName)
    }
  }
  const exerciseOptions = [...names].sort((a, b) => a.localeCompare(b))

  const [exerciseName, setExerciseName] = useState<string>("")

  const selectedExercise = exerciseName || exerciseOptions[0] || ""

  const chartData =
    selectedExercise && sessionsQuery.data
      ? getBestE1RMForExercise(sessionsQuery.data, selectedExercise)
      : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">e1RM (Brzycki)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.08em] text-muted-foreground" htmlFor="e1rm-exercise">
            Exercício
          </label>
          <select
            id="e1rm-exercise"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={selectedExercise}
            onChange={(event) => setExerciseName(event.target.value)}
          >
            {exerciseOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {!chartData.length ? (
          <p className="text-sm text-muted-foreground">Sem dados suficientes para gerar e1RM.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="e1rm" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

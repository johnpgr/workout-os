import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MuscleGroup } from "@/features/training/types"
import { useWeeklyVolumeQuery } from "@/features/progress/queries"

function colorByStatus(status: "low" | "target" | "high"): string {
  if (status === "low") return "#ef4444"
  if (status === "target") return "#22c55e"
  return "#f59e0b"
}

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Peitoral",
  back: "Costas",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Quadríceps",
  hamstrings: "Posterior",
  glutes: "Glúteos",
  calves: "Panturrilhas",
}

export function VolumeChart() {
  const volumeQuery = useWeeklyVolumeQuery()
  const data = volumeQuery.byMuscle.map((entry) => ({
    ...entry,
    muscleLabel: MUSCLE_GROUP_LABELS[entry.muscleGroup],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Séries semanais por músculo</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.length ? (
          <p className="text-sm text-muted-foreground">Sem volume registrado ainda.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="muscleLabel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sets" name="Séries">
                  {data.map((entry) => (
                    <Cell key={`${entry.muscleGroup}-${entry.status}`} fill={colorByStatus(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { RecommendationPanel } from "@/features/readiness/components/recommendation-panel"
import { DeloadDetector } from "@/features/readiness/components/deload-detector"
import { ReadinessCard } from "@/features/readiness/components/readiness-card"
import { ReadinessForm } from "@/features/readiness/components/readiness-form"
import { TipsSection } from "@/features/training/components/tips-section"
import { TrainingOverview } from "@/features/training/components/training-overview"

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <TrainingOverview />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReadinessForm />
        <div className="space-y-4">
          <ReadinessCard />
          <DeloadDetector />
        </div>
      </div>

      <RecommendationPanel />

      <TipsSection />
    </section>
  )
}

export default DashboardPage

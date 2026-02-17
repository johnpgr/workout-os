export type TrainingTermKey = "rpe" | "rir" | "technique"

export interface TrainingTermCopy {
  label: string
  short: string
  wikiUrl: string
  long: string[]
}

export const TRAINING_TERM_COPY: Record<TrainingTermKey, TrainingTermCopy> = {
  rpe: {
    label: "RPE",
    short:
      "Percepção de esforço da série. Escala de 1 a 10; aqui o uso mais comum é entre 6 e 10.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Escala_de_Borg",
    long: [
      "RPE significa Rating of Perceived Exertion (percepção subjetiva de esforço).",
      "Quanto mais próximo de 10, mais perto da falha muscular você está.",
      "No app, você pode usar os atalhos 6-10 para registrar rápido.",
    ],
  },
  rir: {
    label: "RIR",
    short:
      "Repetições em reserva: quantas reps ainda caberiam antes da falha. Relação prática: RIR ≈ 10 - RPE.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Escala_de_Borg",
    long: [
      "RIR significa Reps in Reserve (repetições em reserva).",
      "Exemplo: RPE 8 costuma corresponder a cerca de 2 reps em reserva.",
      "Você registra RPE e o app deriva o RIR para apoiar análise de progressão.",
    ],
  },
  technique: {
    label: "Técnicas",
    short:
      "Métodos para aumentar intensidade, como drop set, rest-pause, superset e myo-reps.",
    wikiUrl: "https://pt.wikipedia.org/wiki/Drop_set",
    long: [
      "Use técnicas quando quiser elevar estímulo sem só aumentar carga.",
      "Sem técnica = série convencional.",
      "Registre quando usar para melhorar a leitura de fadiga e performance.",
    ],
  },
}

export const TRAINING_TERM_ORDER: TrainingTermKey[] = [
  "rpe",
  "rir",
  "technique",
]

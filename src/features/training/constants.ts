import {
  ArrowsClockwiseIcon,
  BarbellIcon,
  ClockCountdownIcon,
  ClipboardTextIcon,
  ForkKnifeIcon,
  PersonSimpleRunIcon,
} from "@phosphor-icons/react"
import type { PlannedType, TipItem, WeekMode, WorkoutPlan } from "@/features/training/types"

export const THEME_STORAGE_KEY = "treinos-theme-preference"

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]

export const TYPE_LABELS: Record<PlannedType, string> = {
  push: "Push",
  pull: "Pull",
  leg: "Legs",
  rest: "Descanso",
}

export const WEEK_PATTERNS: Record<WeekMode, PlannedType[]> = {
  "6": ["push", "pull", "leg", "push", "pull", "leg", "rest"],
  "3": ["push", "rest", "pull", "rest", "leg", "rest", "rest"],
}

export const INFO_CARDS = [
  { label: "Formato", value: "Push / Pull / Legs" },
  { label: "Duração por Sessão", value: "75-90 minutos" },
  { label: "Frequência Semanal", value: "6x (PPL x2) ou 3x" },
  { label: "Nível", value: "Intermediário/Avançado" },
]

export const RETURN_GUIDANCE = [
  "Primeira semana: reduza a carga em 20-30% do que você usava antes da pausa.",
  "Segunda semana: aumente gradualmente para 80-90% da carga anterior.",
  "Terceira semana: retome 100% e continue a progressão normal.",
  "Priorize a técnica correta sobre carga pesada no retorno.",
  "Não force treinar com dor; adapte ou substitua exercícios se necessário.",
  "Hidratação e sono são essenciais para recuperação muscular.",
]

export const WORKOUTS: WorkoutPlan[] = [
  {
    type: "push",
    label: "Push",
    title: "Dia 1: PUSH",
    icon: BarbellIcon,
    badge: "PEITO / OMBRO / TRÍCEPS",
    duration: "80-90 min",
    exercises: [
      {
        name: "Supino Reto (Barra)",
        detail: "Peito completo",
        type: "COMPOSTO",
        setsReps: "4 × 6-8",
        rest: "2-3 min",
        notes: "Movimento principal. Controle na descida, explosão na subida.",
      },
      {
        name: "Supino Inclinado (Halteres)",
        detail: "Peito superior",
        type: "COMPOSTO",
        setsReps: "3 × 8-10",
        rest: "90 seg",
        notes: "Inclinação 30-45°. Amplitude completa, cotovelos a 45°.",
      },
      {
        name: "Desenvolvimento Militar (Barra)",
        detail: "Ombro completo",
        type: "COMPOSTO",
        setsReps: "4 × 6-8",
        rest: "2 min",
        notes: "Pode ser sentado ou em pé. Core ativado, sem hiperextensão lombar.",
      },
      {
        name: "Elevação Lateral (Halteres)",
        detail: "Deltoide lateral",
        type: "ISOLAMENTO",
        setsReps: "3 × 10-12",
        rest: "60 seg",
        notes: "Leve inclinação frontal. Cotovelos levemente flexionados.",
      },
      {
        name: "Crossover ou Crucifixo Inclinado",
        detail: "Peito superior (finalizador)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Foco na contração. Tensão constante, não usar inércia.",
      },
      {
        name: "Tríceps Testa (Barra EZ)",
        detail: "Tríceps (cabeça longa)",
        type: "ISOLAMENTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Cotovelos fixos. Descer até a testa/topo da cabeça.",
      },
      {
        name: "Tríceps Corda (Polia Alta)",
        detail: "Tríceps (cabeça lateral)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Abrir a corda no final. Cotovelos colados ao corpo.",
      },
    ],
  },
  {
    type: "pull",
    label: "Pull",
    title: "Dia 2: PULL",
    icon: ArrowsClockwiseIcon,
    badge: "COSTAS / BÍCEPS / POSTERIOR",
    duration: "80-90 min",
    exercises: [
      {
        name: "Barra Fixa (Pegada Pronada)",
        detail: "Dorsal + redondo maior",
        type: "COMPOSTO",
        setsReps: "4 × 6-10",
        rest: "2-3 min",
        notes: "Use auxílio elástico se necessário. Descer até extensão completa.",
      },
      {
        name: "Remada Curvada (Barra)",
        detail: "Costas completa (espessura)",
        type: "COMPOSTO",
        setsReps: "4 × 8-10",
        rest: "2 min",
        notes: "Pegada supinada ou pronada. Puxar até abdômen inferior.",
      },
      {
        name: "Puxada Frontal (Polia)",
        detail: "Dorsal (largura)",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Pegada aberta, puxar até o peito. Costas arqueadas.",
      },
      {
        name: "Remada Sentada (Polia)",
        detail: "Meio das costas",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Puxar até abdômen, cotovelos para trás. Retrair escápulas.",
      },
      {
        name: "Pullover (Haltere ou Polia)",
        detail: "Dorsal + serrátil",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Alongamento máximo, contração no final. Braços semi-flexionados.",
      },
      {
        name: "Rosca Direta (Barra)",
        detail: "Bíceps completo",
        type: "ISOLAMENTO",
        setsReps: "3 × 8-10",
        rest: "90 seg",
        notes: "Cotovelos fixos. Evitar balanço do corpo.",
      },
      {
        name: "Rosca Martelo (Halteres)",
        detail: "Braquial + braquiorradial",
        type: "ISOLAMENTO",
        setsReps: "3 × 10-12",
        rest: "60 seg",
        notes: "Pegada neutra (palmas frente a frente). Alternado ou simultâneo.",
      },
      {
        name: "Facepull (Polia)",
        detail: "Deltoide posterior + trapézio",
        type: "ISOLAMENTO",
        setsReps: "3 × 15-20",
        rest: "60 seg",
        notes: "Puxar até o rosto, cotovelos altos. Importante para saúde do ombro.",
      },
    ],
  },
  {
    type: "leg",
    label: "Legs",
    title: "Dia 3: LEGS",
    icon: PersonSimpleRunIcon,
    badge: "QUADRÍCEPS / POSTERIOR / GLÚTEOS",
    duration: "75-90 min",
    exercises: [
      {
        name: "Agachamento Livre (Barra)",
        detail: "Pernas completo",
        type: "COMPOSTO",
        setsReps: "4 × 6-8",
        rest: "3-4 min",
        notes: "Rei dos exercícios. Descer até paralelo ou abaixo. Core ativado.",
      },
      {
        name: "Leg Press 45°",
        detail: "Quadríceps + glúteos",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "2 min",
        notes: "Amplitude completa, joelhos alinhados com pés. Não travar joelhos.",
      },
      {
        name: "Stiff (Barra ou Halteres)",
        detail: "Posterior + glúteos",
        type: "COMPOSTO",
        setsReps: "4 × 8-10",
        rest: "2 min",
        notes: "Costas retas, quadril para trás. Sentir alongamento nos posteriores.",
      },
      {
        name: "Avanço (Halteres ou Barra)",
        detail: "Quadríceps + glúteos (unilateral)",
        type: "COMPOSTO",
        setsReps: "3 × 10-12",
        rest: "90 seg",
        notes: "Alternado ou por perna. Joelho não ultrapassa ponta do pé.",
      },
      {
        name: "Cadeira Extensora",
        detail: "Quadríceps (isolado)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Contração máxima no topo. Descer controlado.",
      },
      {
        name: "Mesa Flexora",
        detail: "Posterior (isolado)",
        type: "ISOLAMENTO",
        setsReps: "3 × 12-15",
        rest: "60 seg",
        notes: "Quadril colado no banco. Puxar até 90° ou mais.",
      },
      {
        name: "Panturrilha em Pé (Smith ou Máquina)",
        detail: "Gastrocnêmio",
        type: "ISOLAMENTO",
        setsReps: "4 × 12-15",
        rest: "60 seg",
        notes: "Amplitude completa. Subir na ponta, descer até alongar.",
      },
      {
        name: "Panturrilha Sentado",
        detail: "Sóleo",
        type: "ISOLAMENTO",
        setsReps: "3 × 15-20",
        rest: "45 seg",
        notes: "Complementa a panturrilha em pé. Volume alto.",
      },
    ],
  },
]

export const TIPS: TipItem[] = [
  {
    title: "Progressão de Carga",
    icon: ArrowsClockwiseIcon,
    items: [
      "Aumente 2,5-5kg quando completar todas as séries no topo da faixa de reps.",
      "Para halteres pequenos, aumente 1-2kg por vez.",
      "Se não conseguir manter as reps, mantenha a carga e foque na técnica.",
      "Registre seus treinos para acompanhar evolução.",
    ],
  },
  {
    title: "Frequência Semanal",
    icon: ClockCountdownIcon,
    items: [
      "Opção 1 (6x/semana): Push → Pull → Legs → Push → Pull → Legs → Rest.",
      "Opção 2 (3x/semana): Push → Rest → Pull → Rest → Legs → Rest → Rest.",
      "Escolha baseado na sua recuperação e disponibilidade de tempo.",
      "Mínimo de 1 dia de descanso completo por semana.",
    ],
  },
  {
    title: "Nutrição & Recuperação",
    icon: ForkKnifeIcon,
    items: [
      "Proteína: 1,8-2,2g por kg de peso corporal.",
      "Consuma carboidratos suficientes para sustentar os treinos.",
      "Hidratação: mínimo de 2-3L de água por dia.",
      "Sono: 7-9 horas para recuperação muscular ideal.",
      "Suplementação básica: whey e creatina (5g/dia).",
    ],
  },
  {
    title: "Técnica & Segurança",
    icon: ClipboardTextIcon,
    items: [
      "Aquecimento: 5-10 min de cardio leve + séries específicas.",
      "Priorize amplitude completa de movimento.",
      "Controle a fase excêntrica (negativa) em todas as repetições.",
      "Respiração: expire na contração, inspire na extensão.",
      "Alongamento leve pós-treino por 5-10 min.",
    ],
  },
]

export type Lang = 'fr' | 'en' | 'de' | 'es' | 'it' | string

/** Writing-trainer mastery stage. 0 = new, 3 = mastered (typed 1:1). */
export type WriteStage = 0 | 1 | 2 | 3

export interface Card {
  id: string
  /** Side A — exactly as imported (the prompt by default). */
  term: string
  /** Side B — exactly as imported (the answer by default). */
  translation: string
  /** Progress in the 3-stage writing trainer. */
  writeStage: WriteStage
  /** Swipe-flashcard stats. */
  flash: {
    correct: number
    wrong: number
    lastResult?: 'right' | 'wrong'
  }
  createdAt: number
}

export interface Deck {
  id: string
  name: string
  frontLang: Lang
  backLang: Lang
  cards: Card[]
  createdAt: number
}

export interface Settings {
  /** When false (default), the writing trainer requires an exact 1:1 match. */
  lenient: boolean
  /** Show the first letter of the answer as a hint at Learn Level 1. */
  learnShowHint: boolean
  /** Which side of the flashcard is shown first. */
  cardDirection: 'normal' | 'reverse'
  /** How many card pairs appear in the Match game grid. */
  matchPairs: number
  /** Seconds per Speed round. */
  speedDuration: number
}

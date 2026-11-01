import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { nanoid } from 'nanoid'
import type { Card, Deck, Lang, Settings, WriteStage } from '../types'

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value)
  },
  removeItem: async (name) => {
    await idbDel(name)
  },
}

export interface NewCardInput {
  term: string
  translation: string
}

interface DeckState {
  decks: Deck[]
  settings: Settings
  /** Wrong card IDs per deck, saved at the end of a flashcard session. */
  flashSavedWrong: Record<string, string[]>
  hydrated: boolean

  createDeck: (name: string, frontLang: Lang, backLang: Lang, cards: NewCardInput[]) => string
  appendCards: (deckId: string, cards: NewCardInput[]) => void
  renameDeck: (deckId: string, name: string) => void
  deleteDeck: (deckId: string) => void
  getDeck: (deckId: string) => Deck | undefined

  updateWriteStage: (deckId: string, cardId: string, correct: boolean) => void
  resetWriteProgress: (deckId: string) => void

  recordFlash: (deckId: string, cardId: string, result: 'right' | 'wrong') => void
  resetFlashStats: (deckId: string) => void
  saveFlashWrong: (deckId: string, ids: string[]) => void
  clearFlashWrong: (deckId: string) => void

  updateSettings: (patch: Partial<Settings>) => void
}

function makeCard(input: NewCardInput): Card {
  return {
    id: nanoid(),
    term: input.term,
    translation: input.translation,
    writeStage: 0,
    flash: { correct: 0, wrong: 0 },
    createdAt: Date.now(),
  }
}

function clampStage(n: number): WriteStage {
  return Math.max(0, Math.min(3, n)) as WriteStage
}

const DEFAULT_SETTINGS: Settings = {
  lenient: false,
  learnShowHint: false,
  cardDirection: 'normal',
  matchPairs: 6,
  speedDuration: 60,
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      decks: [],
      settings: DEFAULT_SETTINGS,
      flashSavedWrong: {},
      hydrated: false,

      createDeck: (name, frontLang, backLang, cards) => {
        const deck: Deck = {
          id: nanoid(),
          name: name.trim() || 'Untitled deck',
          frontLang,
          backLang,
          cards: cards.map(makeCard),
          createdAt: Date.now(),
        }
        set((s) => ({ decks: [deck, ...s.decks] }))
        return deck.id
      },

      appendCards: (deckId, cards) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId ? { ...d, cards: [...d.cards, ...cards.map(makeCard)] } : d,
          ),
        })),

      renameDeck: (deckId, name) =>
        set((s) => ({
          decks: s.decks.map((d) => (d.id === deckId ? { ...d, name: name.trim() || d.name } : d)),
        })),

      deleteDeck: (deckId) =>
        set((s) => ({
          decks: s.decks.filter((d) => d.id !== deckId),
          flashSavedWrong: Object.fromEntries(
            Object.entries(s.flashSavedWrong).filter(([k]) => k !== deckId),
          ),
        })),

      getDeck: (deckId) => get().decks.find((d) => d.id === deckId),

      updateWriteStage: (deckId, cardId, correct) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id !== deckId
              ? d
              : {
                  ...d,
                  cards: d.cards.map((c) =>
                    c.id !== cardId
                      ? c
                      : { ...c, writeStage: clampStage(c.writeStage + (correct ? 1 : -1)) },
                  ),
                },
          ),
        })),

      resetWriteProgress: (deckId) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id !== deckId
              ? d
              : { ...d, cards: d.cards.map((c) => ({ ...c, writeStage: 0 as WriteStage })) },
          ),
        })),

      recordFlash: (deckId, cardId, result) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id !== deckId
              ? d
              : {
                  ...d,
                  cards: d.cards.map((c) =>
                    c.id !== cardId
                      ? c
                      : {
                          ...c,
                          flash: {
                            correct: c.flash.correct + (result === 'right' ? 1 : 0),
                            wrong: c.flash.wrong + (result === 'wrong' ? 1 : 0),
                            lastResult: result,
                          },
                        },
                  ),
                },
          ),
        })),

      resetFlashStats: (deckId) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id !== deckId
              ? d
              : { ...d, cards: d.cards.map((c) => ({ ...c, flash: { correct: 0, wrong: 0 } })) },
          ),
        })),

      saveFlashWrong: (deckId, ids) =>
        set((s) => ({ flashSavedWrong: { ...s.flashSavedWrong, [deckId]: ids } })),

      clearFlashWrong: (deckId) =>
        set((s) => {
          const next = { ...s.flashSavedWrong }
          delete next[deckId]
          return { flashSavedWrong: next }
        }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'voci-trainer',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ decks: s.decks, settings: s.settings, flashSavedWrong: s.flashSavedWrong }),
      onRehydrateStorage: () => (state) => {
        useDeckStore.setState({ hydrated: true })
        void state
      },
    },
  ),
)

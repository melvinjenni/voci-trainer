/** Answer comparison for the writing trainer.
 *
 *  Default (strict) mode requires an exact 1:1 match with the imported text —
 *  this is what "write the voci exactly the same" means. Only the outer
 *  whitespace is trimmed (the import already trimmed it too).
 *
 *  Lenient mode is an opt-in that ignores case, accents and trailing
 *  punctuation, and collapses inner whitespace — handy for forgiving practice.
 */

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function normalizeLenient(s: string): string {
  return stripAccents(s.trim().toLowerCase())
    .replace(/[.,!?;:]+$/g, '') // trailing punctuation
    .replace(/\s+/g, ' ') // collapse inner whitespace
}

export function isCorrect(answer: string, expected: string, lenient: boolean): boolean {
  if (lenient) return normalizeLenient(answer) === normalizeLenient(expected)
  return answer.trim() === expected.trim()
}

/** Build a masked hint for a given expected answer.
 *  level 'first'  -> reveal first letter of each word, rest as blanks.
 *  level 'strong' -> reveal first letter + show word lengths clearly. */
export function buildHint(expected: string, level: 'first' | 'strong'): string {
  return expected
    .split(/(\s+)/) // keep the whitespace groups
    .map((chunk) => {
      if (/^\s+$/.test(chunk) || chunk === '') return chunk
      const chars = [...chunk]
      return chars
        .map((ch, i) => {
          if (i === 0) return ch
          if (/[^\p{L}\p{N}]/u.test(ch)) return ch // keep punctuation visible
          return level === 'strong' ? '_' : '_'
        })
        .join('')
    })
    .join('')
}

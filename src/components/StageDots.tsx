import type { WriteStage } from '../types'

/** Three dots showing a card's writing-trainer progress (stage 0..3). */
export default function StageDots({ stage }: { stage: WriteStage }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Stage ${stage} of 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i <= stage ? 'bg-brand-500' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

import type { FeatureType } from '@/types'

interface Props {
  label: string
  type: FeatureType
  size?: 'sm' | 'lg'
}

export default function FeatureIcon({ label, size = 'sm' }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 font-semibold bg-accent-soft text-accent ${
        size === 'lg'
          ? 'w-14 h-14 text-[17px] rounded-xl shadow-[0_2px_8px_rgba(161,0,255,0.18)]'
          : 'w-8 h-8 text-[11px] rounded-lg shadow-[0_1px_4px_rgba(161,0,255,0.15)]'
      }`}
    >
      {label}
    </span>
  )
}

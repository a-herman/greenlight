'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { CheckStat } from '@/types'

const COLORS = {
  pass:        '#A100FF',
  conditional: '#D5A6FF',
  fail:        '#FF52A0',
  needs_info:  '#93C5FD',
}

const LEGEND = [
  { key: 'pass',        label: 'Pass' },
  { key: 'conditional', label: 'Conditional' },
  { key: 'fail',        label: 'Fail' },
  { key: 'needs_info',  label: 'Needs info' },
] as const

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-lg shadow-md p-3 text-[12px]">
      <div className="font-semibold text-ink mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-secondary">{p.name}:</span>
          <span className="font-medium text-ink ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function CheckDistributionChart({ data }: { data: CheckStat[] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-medium text-tertiary mb-5">
        Policy checks by governance function
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="function"
            width={58}
            tick={{ fontSize: 12, fill: '#6B6B6B' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5EDFF', opacity: 0.5 }} />
          <Bar dataKey="pass"        name="Pass"        stackId="a" fill={COLORS.pass}        radius={[0, 0, 0, 0]} />
          <Bar dataKey="conditional" name="Conditional" stackId="a" fill={COLORS.conditional} radius={[0, 0, 0, 0]} />
          <Bar dataKey="fail"        name="Fail"        stackId="a" fill={COLORS.fail}        radius={[0, 0, 0, 0]} />
          <Bar dataKey="needs_info"  name="Needs info"  stackId="a" fill={COLORS.needs_info}  radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-5 mt-3">
        {LEGEND.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[key] }} />
            <span className="text-[12px] text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

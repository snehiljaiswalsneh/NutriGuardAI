import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Ingredient } from '@/data/types'
import { useLanguage } from '@/context/LanguageContext'

const COLORS = { safe: '#0E9F6E', moderate: '#F59E0B', high: '#DC2626', unknown: '#D1D5DB' }

export function RiskAnalysisChart({ ingredients }: { ingredients: Ingredient[] }) {
  const { t } = useLanguage()
  const counts = { safe: 0, moderate: 0, high: 0, unknown: 0 }
  ingredients.forEach((i) => counts[i.risk]++)
  const data = [
    { name: t('chart.safe'), value: counts.safe, key: 'safe' },
    { name: t('chart.moderate'), value: counts.moderate, key: 'moderate' },
    { name: t('chart.highRisk'), value: counts.high, key: 'high' },
    { name: t('chart.unknown'), value: counts.unknown, key: 'unknown' },
  ]

  return (
    <div className="h-56 w-full" aria-label={t('chart.aria')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5563' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#111827' }} axisLine={false} tickLine={false} width={80} />
          <Tooltip cursor={{ fill: '#F9FAFB' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

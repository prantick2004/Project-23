import { GlassCard } from '@/components/ui/GlassCard'
import { BarsChart, TrendArea } from '@/components/charts/Charts'
import { chartColors } from '@/components/charts/theme'
import { teaserTrend } from '@/data/marketing'

export default function AnalyticsTeaser() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <GlassCard className="lg:col-span-3">
        <h3 className="font-medium text-white">Weekly presence</h3>
        <p className="mb-4 text-xs text-slate-400">Illustrative sample · aggregated, no personal data</p>
        <TrendArea data={teaserTrend} xKey="d" unit="%" domain={[80, 100]} series={[{ key: 'presence', name: 'Presence', color: chartColors.cyan }]} />
      </GlassCard>
      <GlassCard className="lg:col-span-2">
        <h3 className="font-medium text-white">Detection events</h3>
        <p className="mb-4 text-xs text-slate-400">Illustrative sample</p>
        <BarsChart data={teaserTrend} xKey="d" series={[{ key: 'events', name: 'Events', color: chartColors.indigo }]} />
      </GlassCard>
    </div>
  )
}

import { useId } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartColors as c, tooltipStyle } from './theme'

const axis = { stroke: c.axis, fontSize: 11, tickLine: false, axisLine: false } as const
const legend = { wrapperStyle: { fontSize: 12, color: '#9aa4bb' }, iconType: 'circle' as const, iconSize: 8 }

interface Series {
  key: string
  name: string
  color: string
}

export function TrendArea({ data, xKey, series, height = 260, unit, domain }: { data: object[]; xKey: string; series: Series[]; height?: number; unit?: string; domain?: [number, number] }) {
  return (
    <div role="img" aria-label="Trend chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axis} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...axis} unit={unit} domain={domain} />
          <Tooltip {...tooltipStyle} />
          {series.length > 1 && <Legend {...legend} />}
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} animationDuration={900} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SimpleLine({ data, xKey, series, height = 220 }: { data: object[]; xKey: string; series: Series[]; height?: number }) {
  return (
    <div role="img" aria-label="Line chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axis} interval="preserveStartEnd" minTickGap={24} />
          <YAxis {...axis} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          {series.length > 1 && <Legend {...legend} />}
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={900} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarsChart({ data, xKey, series, height = 240, stacked }: { data: object[]; xKey: string; series: Series[]; height?: number; stacked?: boolean }) {
  return (
    <div role="img" aria-label="Bar chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 6, top: 6 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axis} interval={0} tick={{ fontSize: 10 }} />
          <YAxis {...axis} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          {series.length > 1 && <Legend {...legend} />}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[6, 6, 0, 0]} stackId={stacked ? 'a' : undefined} maxBarSize={28} animationDuration={900} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({ data, height = 200 }: { data: { name: string; value: number; color: string }[]; height?: number }) {
  return (
    <div role="img" aria-label="Distribution chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip {...tooltipStyle} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none" animationDuration={900}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Legend {...legend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Ring({ value, size = 120, label }: { value: number; size?: number; label?: string }) {
  const gid = useId()
  const r = 46
  const len = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${value}% ${label ?? ''}`}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" strokeDasharray={len} style={{ ['--len' as string]: len, animation: 'draw 1.2s cubic-bezier(.2,.7,.2,1) both' }} strokeDashoffset={len * (1 - value / 100)} />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-semibold text-white tabular-nums">{value}%</p>
        {label && <p className="text-[11px] text-slate-400">{label}</p>}
      </div>
    </div>
  )
}

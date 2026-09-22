"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { weeklyAttendanceTrend, storeDistribution, cameraStatusDistribution } from "@/lib/mock-data/operations";

const COLORS = ["#00D4FF", "#7868FF", "#34D399", "#F59E0B", "#F43F5E"];

export function AttendanceTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={weeklyAttendanceTrend}>
        <defs>
          <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94A3B8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
        <Tooltip />
        <Area type="monotone" dataKey="present" stroke="#00D4FF" fill="url(#present)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StoreDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={storeDistribution}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
        <Tooltip />
        <Bar dataKey="employees" fill="#7868FF" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CameraStatusPie() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={cameraStatusDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {cameraStatusDistribution.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

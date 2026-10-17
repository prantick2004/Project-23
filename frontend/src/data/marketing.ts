/** Public-page content. Aggregated, illustrative figures only — no employee data. */
import { Cpu, Eye, LineChart, Lock, Moon, Radar, ShieldCheck, Smartphone, UserCheck, CalendarCheck, Camera, History, Users, type LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  body: string
}

export const detectionCards: Feature[] = [
  { icon: Smartphone, title: 'Phone Detection', body: 'Identifies mobile-phone use in the camera view and logs a timestamped event.' },
  { icon: Moon, title: 'Sleeping Detection', body: 'Flags drowsiness-related posture over time to reduce one-frame false alarms.' },
  { icon: UserCheck, title: 'Employee Presence', body: 'Records when employees are detected by a camera, floor by floor.' },
  { icon: CalendarCheck, title: 'Attendance Detection', body: 'Turns detection history into daily presence and attendance insight.' },
]

export const features: Feature[] = [
  { icon: Camera, title: 'CCTV Monitoring', body: 'Monitor multiple camera feeds in one place with live status, counts and last-frame time.' },
  { icon: Users, title: 'Employee Detection', body: 'Track when employees are detected by the CCTV system, with searchable history.' },
  { icon: Smartphone, title: 'Phone Detection', body: 'Review mobile-phone detection events with camera, time and confidence.' },
  { icon: Moon, title: 'Sleeping / Drowsiness Detection', body: 'See drowsiness-related events in context, with neutral severity indicators.' },
  { icon: CalendarCheck, title: 'Attendance Analytics', body: 'Detection-based presence by day, week and month, with calendar views.' },
  { icon: History, title: 'Incident History', body: 'Browse and filter previous detection events, and mark them reviewed.' },
  { icon: LineChart, title: 'Analytics', body: 'Charts and statistics for administrators across attendance, events and cameras.' },
  { icon: ShieldCheck, title: 'Role-Based Access', body: 'Admins see the whole workplace; employees see only their own records.' },
]

export const pillars: Feature[] = [
  { icon: Eye, title: 'CCTV monitoring', body: 'One place for every camera and its current state.' },
  { icon: Users, title: 'Employee presence tracking', body: 'Know when and where employees were detected.' },
  { icon: Cpu, title: 'AI-based event detection', body: 'Phone use and drowsiness surfaced as structured events.' },
  { icon: CalendarCheck, title: 'Attendance insights', body: 'Presence turned into clear daily and monthly attendance.' },
  { icon: Radar, title: 'Centralized monitoring', body: 'Admins get a single operational overview.' },
  { icon: History, title: 'Incident history', body: 'A reviewable record of past detection events.' },
  { icon: LineChart, title: 'Workplace analytics', body: 'Trends that show how the workplace is running.' },
  { icon: Lock, title: 'Private by design', body: 'Sensitive data appears only after sign-in.' },
]

/** Illustrative weekly shape for the public analytics teaser. */
export const teaserTrend = [
  { d: 'Mon', presence: 92, events: 7 },
  { d: 'Tue', presence: 95, events: 5 },
  { d: 'Wed', presence: 91, events: 8 },
  { d: 'Thu', presence: 94, events: 4 },
  { d: 'Fri', presence: 88, events: 6 },
]

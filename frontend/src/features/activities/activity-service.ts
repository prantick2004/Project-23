// Future integration: app/api/routers/v1/activities.py
import { mockActivities } from "@/lib/mock-data/operations";
import { ActivityEvent } from "@/types";

export async function getActivities(): Promise<ActivityEvent[]> {
  return mockActivities;
}

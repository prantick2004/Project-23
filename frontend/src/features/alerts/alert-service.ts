// Future integration: app/api/routers/v1/alerts.py + app/api/websockets/alert_stream.py
import { mockAlerts } from "@/lib/mock-data/operations";
import { AlertItem } from "@/types";

export async function getAlerts(): Promise<AlertItem[]> {
  return mockAlerts;
}

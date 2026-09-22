// Future integration: app/api/routers/v1/reports.py
import { mockReports } from "@/lib/mock-data/operations";
import { ReportDefinition } from "@/types";

export async function getReportDefinitions(): Promise<ReportDefinition[]> {
  return mockReports;
}

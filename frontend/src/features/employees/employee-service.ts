// Future integration: app/api/routers/v1/employees.py
// For now, returns mock data with an artificial delay to simulate async behavior.
import { mockEmployees } from "@/lib/mock-data/employees";
import { Employee } from "@/types";

export async function getEmployees(): Promise<Employee[]> {
  return mockEmployees;
}

export async function getEmployeeById(id: string): Promise<Employee | undefined> {
  return mockEmployees.find((e) => e.id === id || e.employeeId === id);
}

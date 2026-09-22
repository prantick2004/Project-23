import { Employee } from "@/types";

const first = ["Riya", "Arjun", "Sneha", "Kabir", "Ananya", "Vikram", "Meera", "Aditya", "Ishaan", "Tanya", "Rahul", "Divya"];
const last = ["Sharma", "Mehta", "Ghosh", "Kapoor", "Iyer", "Das", "Bose", "Verma", "Reddy", "Malhotra"];
const depts = ["Operations", "Sales", "Security", "Warehouse", "Customer Support", "Admin"];
const positions = ["Associate", "Team Lead", "Executive", "Supervisor", "Coordinator"];
const stores = [
  { id: "st_1", name: "Salt Lake Flagship" },
  { id: "st_2", name: "Park Street Branch" },
  { id: "st_3", name: "New Town Warehouse" },
  { id: "st_4", name: "Howrah Distribution Hub" },
];
const statuses: Employee["status"][] = ["active", "active", "active", "inactive", "suspended"];

function seededPick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export const mockEmployees: Employee[] = Array.from({ length: 36 }).map((_, i) => {
  const f = seededPick(first, i);
  const l = seededPick(last, i * 3 + 1);
  const store = seededPick(stores, i * 5 + 2);
  return {
    id: `emp_${i + 1}`,
    employeeId: `EMP-${String(1000 + i)}`,
    firstName: f,
    lastName: l,
    email: `${f.toLowerCase()}.${l.toLowerCase()}@nitsolution-demo.com`,
    mobile: `+91 9${String(100000000 + i * 7919).slice(0, 9)}`,
    storeId: store.id,
    storeName: store.name,
    department: seededPick(depts, i * 2 + 1),
    position: seededPick(positions, i),
    status: seededPick(statuses, i * 3),
    joinedAt: `202${(i % 4) + 1}-0${(i % 9) + 1}-1${i % 3}`,
  };
});

import { Store } from "@/types";

export const mockStores: Store[] = [
  {
    id: "st_1",
    storeId: "STR-001",
    name: "Salt Lake Flagship",
    address: "DN Block, Sector V, Kolkata, WB",
    managerName: "Arindam Sen",
    employeeCount: 42,
    cameraCount: 12,
    status: "active",
  },
  {
    id: "st_2",
    storeId: "STR-002",
    name: "Park Street Branch",
    address: "Park Street, Kolkata, WB",
    managerName: "Priya Nair",
    employeeCount: 28,
    cameraCount: 8,
    status: "active",
  },
  {
    id: "st_3",
    storeId: "STR-003",
    name: "New Town Warehouse",
    address: "Action Area II, New Town, Kolkata, WB",
    managerName: "Rohit Khanna",
    employeeCount: 19,
    cameraCount: 10,
    status: "active",
  },
  {
    id: "st_4",
    storeId: "STR-004",
    name: "Howrah Distribution Hub",
    address: "GT Road, Howrah, WB",
    managerName: "Sunita Rao",
    employeeCount: 15,
    cameraCount: 6,
    status: "inactive",
  },
];

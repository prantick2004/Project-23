import { Camera } from "@/types";

const stores = [
  { id: "st_1", name: "Salt Lake Flagship" },
  { id: "st_2", name: "Park Street Branch" },
  { id: "st_3", name: "New Town Warehouse" },
  { id: "st_4", name: "Howrah Distribution Hub" },
];
const locations = ["Main Entrance", "Sales Floor", "Warehouse Aisle 3", "Server Room", "Parking Lot", "Reception", "Loading Dock", "Break Room"];
const types: Camera["type"][] = ["ip", "rtsp", "cctv", "usb"];
const statuses: Camera["status"][] = ["online", "online", "online", "offline", "connecting", "error"];

export const mockCameras: Camera[] = Array.from({ length: 24 }).map((_, i) => {
  const store = stores[i % stores.length];
  return {
    id: `cam_${i + 1}`,
    cameraId: `CAM-${String(i + 1).padStart(3, "0")}`,
    name: `${locations[i % locations.length]} Cam`,
    storeId: store.id,
    storeName: store.name,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    location: locations[i % locations.length],
  };
});

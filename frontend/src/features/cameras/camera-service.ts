// Future integration: app/api/routers/v1/cameras.py + app/api/websockets/camera_stream.py
import { mockCameras } from "@/lib/mock-data/cameras";
import { Camera } from "@/types";

export async function getCameras(): Promise<Camera[]> {
  return mockCameras;
}

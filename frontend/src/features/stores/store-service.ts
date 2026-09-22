// Future integration: dedicated stores endpoint (not yet present in backend router list)
import { mockStores } from "@/lib/mock-data/stores";
import { Store } from "@/types";

export async function getStores(): Promise<Store[]> {
  return mockStores;
}

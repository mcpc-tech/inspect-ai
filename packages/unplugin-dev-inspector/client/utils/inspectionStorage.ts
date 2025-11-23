import type { InspectionItem } from "../components/InspectionQueue";

const STORAGE_KEY = "inspector-inspection-items";

export function loadInspectionItems(): InspectionItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveInspectionItems(items: InspectionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn("Failed to save inspection items");
  }
}

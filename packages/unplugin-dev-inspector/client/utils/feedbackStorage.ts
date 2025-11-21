import type { FeedbackItem } from "../components/FeedbackCart";

const STORAGE_KEY = "inspector-feedback-items";

export function loadFeedbackItems(): FeedbackItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveFeedbackItems(items: FeedbackItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn("Failed to save feedback items");
  }
}

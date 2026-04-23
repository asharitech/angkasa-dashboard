import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Stable string key for Mongo `_id` (ObjectId or string) without importing `mongodb` in client bundles. */
export function idString(id: unknown): string {
  if (typeof id === "string") return id;
  if (id != null && typeof id === "object" && "toString" in id && typeof (id as { toString(): string }).toString === "function") {
    return (id as { toString(): string }).toString();
  }
  return String(id);
}

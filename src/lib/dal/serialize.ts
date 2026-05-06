import { ObjectId } from "mongodb";
import type { DbDate } from "@/lib/db/schema";

export function dbDateToDateOnlyString(d: DbDate | undefined | null): string | undefined {
  if (d == null) return undefined;
  if (typeof d === "string") return d;
  return d.toISOString().slice(0, 10);
}

/** Serialize Dates / ObjectIds for RSC props (Next.js cannot pass BSON types to client). */
export function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString().slice(0, 10) as unknown as T;
  if (obj instanceof ObjectId) return obj.toString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDates) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDates(value);
    }
    return result as T;
  }
  return obj;
}

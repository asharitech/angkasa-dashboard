import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function parseObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

/** `_id` filter when the route accepts either a BSON ObjectId or a string key. */
export function mongoIdFilter(id: string): { _id: ObjectId | string } {
  const oid = parseObjectId(id);
  if (oid) return { _id: oid };
  return { _id: id };
}

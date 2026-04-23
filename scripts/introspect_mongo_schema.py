#!/usr/bin/env python3
"""Introspect MongoDB collections: list names, sample docs, infer merged field types.
Reads MONGODB_URI and MONGODB_DB from env (load .env.local then ../../.env)."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

try:
    from bson import Binary, Decimal128, Int64, ObjectId
    from bson.regex import Regex
except ImportError:
    print("Install pymongo: pip install pymongo", file=sys.stderr)
    sys.exit(1)

from pymongo import MongoClient


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


def type_name(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "bool"
    if isinstance(v, int) and not isinstance(v, bool):
        if isinstance(v, Int64):
            return "int64"
        return "int"
    if isinstance(v, float):
        return "float"
    if isinstance(v, Decimal):
        return "decimal"
    if isinstance(v, Decimal128):
        return "decimal128"
    if isinstance(v, str):
        return "string"
    if isinstance(v, ObjectId):
        return "objectId"
    if isinstance(v, datetime):
        return "date"
    if isinstance(v, bytes):
        return "bytes"
    if isinstance(v, Binary):
        return "binary"
    if isinstance(v, Regex):
        return "regex"
    if isinstance(v, list):
        if not v:
            return "array<empty>"
        inner = {type_name(x) for x in v[:20]}
        return f"array<{ '|'.join(sorted(inner)) }>"
    if isinstance(v, dict):
        return "object"
    return type(v).__name__


def merge_types(a: str, b: str) -> str:
    if a == b:
        return a
    s = "|".join(sorted({x for part in (a, b) for x in part.split("|")}))
    return s


def walk_doc(
    prefix: str,
    doc: dict[str, Any],
    acc: dict[str, str],
) -> None:
    for k, v in doc.items():
        path = f"{prefix}.{k}" if prefix else k
        t = type_name(v)
        if path in acc:
            acc[path] = merge_types(acc[path], t)
        else:
            acc[path] = t
        if isinstance(v, dict) and v:
            walk_doc(path, v, acc)
        if isinstance(v, list) and v and isinstance(v[0], dict):
            for item in v[:5]:
                if isinstance(item, dict):
                    walk_doc(f"{path}[]", item, acc)


def main() -> None:
    root = Path(__file__).resolve().parents[1]  # angkasa-dashboard/
    load_env_file(root / ".env.local")
    # Workspace canonical .env: playgrounds/angkasa-dashboard -> ../../.env
    load_env_file(root.parent.parent / ".env")

    uri = os.environ.get("MONGODB_URI")
    dbn = os.environ.get("MONGODB_DB")
    if not uri or not dbn:
        print("MONGODB_URI and MONGODB_DB required", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(uri, serverSelectionTimeoutMS=15000)
    db = client[dbn]
    names = sorted(db.list_collection_names())

    out: dict[str, Any] = {"database": dbn, "collections": {}}

    for name in names:
        if name.startswith("system."):
            continue
        coll = db[name]
        acc: dict[str, str] = {}
        count = coll.estimated_document_count()
        try:
            for doc in coll.find({}).limit(80):
                if isinstance(doc, dict):
                    walk_doc("", doc, acc)
        except Exception as e:  # noqa: BLE001
            out["collections"][name] = {"error": str(e), "estimated_count": count}
            continue
        out["collections"][name] = {
            "estimated_count": count,
            "fields": dict(sorted(acc.items())),
        }

    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    main()

/**
 * Seed admin user for Angkasa Dashboard
 * Run: npx tsx scripts/seed-admin.ts
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { dbCollections } from "../src/lib/db/collections";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "agent-asharitech-angkasa";

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const c = dbCollections(client.db(dbName));

  const existing = await c.users.findOne({ username: "angkasa" });
  if (existing) {
    console.log("Admin user 'angkasa' already exists, skipping.");
    await client.close();
    return;
  }

  const password_hash = await bcrypt.hash("angkasa2024", 12);
  await c.users.insertOne({
    username: "angkasa",
    password_hash,
    name: "Muhammad Angkasa Putra Ranu",
    role: "admin",
    phone: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  console.log("Admin user 'angkasa' created successfully.");
  console.log("Username: angkasa");
  console.log("Password: angkasa2024");
  console.log("IMPORTANT: Change password after first login!");
  await client.close();
}

seed().catch(console.error);

import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await cachedClient.connect();
  return cachedClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

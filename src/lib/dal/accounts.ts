import { ACCOUNTS } from "@/lib/config";
import type { Account } from "@/lib/types";
import { getCollections } from "./context";
import { getNumpangActive } from "./numpang";

export async function getAccounts(): Promise<Account[]> {
  const c = await getCollections();
  return c.accounts.find().toArray();
}

export async function computeBriKas(): Promise<{ briBalance: number; numpangTotal: number; briKas: number }> {
  const c = await getCollections();
  const [bri, numpang] = await Promise.all([
    c.accounts.findOne({ _id: ACCOUNTS.personalBri }),
    getNumpangActive(),
  ]);
  const briBalance = bri?.balance ?? 0;
  const numpangTotal = numpang.reduce((s, n) => s + n.amount, 0);
  return { briBalance, numpangTotal, briKas: briBalance - numpangTotal };
}

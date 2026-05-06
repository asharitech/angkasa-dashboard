import { ACCOUNTS } from "@/lib/config";
import { getCollections } from "./context";
import { getNumpangActive } from "./numpang";

export async function getDanaPribadiSummary() {
  const c = await getCollections();

  const [bcaAccount, briAccount, personalEntries, numpangActive] = await Promise.all([
    c.accounts.findOne({ _id: ACCOUNTS.personalBca }),
    c.accounts.findOne({ _id: ACCOUNTS.personalBri }),
    c.entries.find({ domain: "personal" }).sort({ date: -1 }).limit(50).toArray(),
    getNumpangActive(),
  ]);

  const bcaBalance = bcaAccount?.balance ?? 0;
  const briEstatement = briAccount?.balance ?? 0;
  const numpangTotal = numpangActive.reduce((s, n) => s + n.amount, 0);
  const briKas = briEstatement - numpangTotal;
  const briBersih = briKas;
  const totalCashBersih = bcaBalance + briBersih;

  const numpangEntries = numpangActive.map((n) => ({ key: n._id, amount: n.amount, description: n.description }));

  return {
    bcaAccount,
    briAccount,
    bcaBalance,
    briKas,
    briEstatement,
    briBersih,
    numpangTotal,
    numpangEntries,
    totalCashBersih,
    personalEntries,
  };
}

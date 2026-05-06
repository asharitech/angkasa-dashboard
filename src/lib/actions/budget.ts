"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { requireAdmin, actionError } from "@/lib/auth-helpers";
import type { BudgetConfigDoc } from "@/lib/db/schema";

type BudgetCategoryDoc = BudgetConfigDoc["categories"][number];
type BudgetFixedDeductionDoc = BudgetConfigDoc["fixed_deductions"][number];

type ActionResult = { ok: true } | { error: string };

export interface UpdateBudgetInput {
  monthly_income: number;
  bonus_income: number;
  fixed_deductions: BudgetFixedDeductionDoc[];
  categories: BudgetCategoryDoc[];
  month: string;
}

export async function updateBudgetAction(input: UpdateBudgetInput): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());

    if (!Number.isFinite(input.monthly_income) || input.monthly_income < 0) {
      return { error: "Pendapatan tidak valid" };
    }
    if (!Number.isFinite(input.bonus_income) || input.bonus_income < 0) {
      return { error: "Bonus tidak valid" };
    }

    const now = new Date();

    await c.budget_configs.updateOne(
      { _id: "angkasa" },
      {
        $set: {
          monthly_income: input.monthly_income,
          bonus_income: input.bonus_income,
          fixed_deductions: input.fixed_deductions,
          categories: input.categories,
          month: input.month,
          updated_at: now,
        },
      },
      { upsert: true }
    );

    revalidatePath("/anggaran");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function addBonusIncomeAction(amount: number, _note?: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());

    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Jumlah bonus tidak valid" };
    }

    const now = new Date();
    const cfg = await c.budget_configs.findOne({ _id: "angkasa" });
    const currentBonus = (cfg as { bonus_income?: number } | null)?.bonus_income ?? 0;

    await c.budget_configs.updateOne(
      { _id: "angkasa" },
      {
        $set: {
          bonus_income: currentBonus + amount,
          updated_at: now,
        },
      },
      { upsert: true }
    );

    revalidatePath("/anggaran");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function resetBonusAction(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());

    await c.budget_configs.updateOne(
      { _id: "angkasa" },
      { $set: { bonus_income: 0, updated_at: new Date() } }
    );

    revalidatePath("/anggaran");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

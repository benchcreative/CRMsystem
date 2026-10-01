"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdSpendSource } from "@/lib/labels";
import { poundsToPence } from "@/lib/currency";
import type { Source } from "@prisma/client";

export type AdSpendFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
};

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function parseMonth(value: string): Date | null {
  if (!MONTH_PATTERN.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

export async function saveAdSpend(
  _prevState: AdSpendFormState,
  formData: FormData
): Promise<AdSpendFormState> {
  const values = {
    source: String(formData.get("source") ?? ""),
    month: String(formData.get("month") ?? ""),
    amount: String(formData.get("amount") ?? ""),
  };

  const errors: Record<string, string> = {};

  if (!values.source || !isAdSpendSource(values.source)) {
    errors.source = "Choose a source.";
  }

  const month = parseMonth(values.month);
  if (!month) errors.month = "Choose a month.";

  const amountPounds = Number(values.amount);
  if (values.amount === "" || Number.isNaN(amountPounds) || amountPounds < 0) {
    errors.amount = "Enter a valid amount.";
  }

  if (Object.keys(errors).length > 0 || !month) {
    return { errors, values };
  }

  const source = values.source as Source;
  const amount = poundsToPence(amountPounds);

  await prisma.adSpend.upsert({
    where: { source_month: { source, month } },
    create: { source, month, amount },
    update: { amount },
  });

  revalidatePath("/marketing");
  redirect("/marketing");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseEmbedDomains } from "@/lib/embed";

export type SettingsFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
};

function readSettingsForm(formData: FormData) {
  return {
    companyName: String(formData.get("companyName") ?? "").trim(),
    addressLine1: String(formData.get("addressLine1") ?? "").trim(),
    addressLine2: String(formData.get("addressLine2") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    vatNumber: String(formData.get("vatNumber") ?? "").trim(),
    notificationEmail: String(formData.get("notificationEmail") ?? "").trim(),
    allowedEmbedDomains: String(formData.get("allowedEmbedDomains") ?? "").trim(),
    logoUrl: String(formData.get("logoUrl") ?? "").trim(),
    brandColor: String(formData.get("brandColor") ?? "").trim(),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function validateSettingsForm(values: ReturnType<typeof readSettingsForm>) {
  const errors: Record<string, string> = {};

  if (!values.companyName) errors.companyName = "Company name is required.";
  if (!values.addressLine1) errors.addressLine1 = "Address is required.";
  if (!values.phone) errors.phone = "Phone is required.";
  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.notificationEmail && !EMAIL_PATTERN.test(values.notificationEmail)) {
    errors.notificationEmail = "Enter a valid email address.";
  }
  const { invalid } = parseEmbedDomains(values.allowedEmbedDomains);
  if (invalid.length > 0) {
    errors.allowedEmbedDomains = `Not a valid domain: ${invalid.join(", ")}`;
  }
  if (values.logoUrl && !isHttpUrl(values.logoUrl)) {
    errors.logoUrl = "Enter a full image URL starting with https://";
  }
  if (!HEX_COLOR_PATTERN.test(values.brandColor)) {
    errors.brandColor = "Enter a colour like #D98A2E.";
  }

  return errors;
}

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const values = readSettingsForm(formData);
  const errors = validateSettingsForm(values);

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const data = {
    companyName: values.companyName,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2 || null,
    phone: values.phone,
    email: values.email,
    vatNumber: values.vatNumber || null,
    notificationEmail: values.notificationEmail || null,
    // Stored normalised (bare hostnames), whatever format was pasted in.
    allowedEmbedDomains: parseEmbedDomains(values.allowedEmbedDomains).hostnames.join(", "),
    logoUrl: values.logoUrl || null,
    brandColor: values.brandColor.toUpperCase(),
  };

  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  revalidatePath("/settings");
  redirect("/settings");
}

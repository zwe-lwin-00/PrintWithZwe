import type { ContactConfig } from "@/types/config";

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function phoneTelLink(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return digits ? `tel:+${digits.replace(/^\+?/, "")}` : "";
}

function telegramLink(username: string): string {
  const handle = username.replace(/^@/, "");
  return `https://t.me/${handle}`;
}

function formatPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

function telegramDisplay(username: string): string {
  const handle = username.replace(/^@/, "");
  return `@${handle}`;
}

export interface ContactLinks {
  phone: string;
  phoneTel: string;
  phoneDisplay: string;
  telegram: string;
  telegramDisplay: string;
  hasPhone: boolean;
  hasTelegram: boolean;
  locationUrl: string;
}

export function buildContactLinks(contact: ContactConfig): ContactLinks {
  const phone = contact.phoneNumber?.trim() ?? "";

  return {
    phone,
    phoneTel: phoneTelLink(phone),
    phoneDisplay: formatPhoneDisplay(phone),
    telegram: telegramLink(contact.telegramUsername),
    telegramDisplay: telegramDisplay(contact.telegramUsername),
    hasPhone: phone.length > 0,
    hasTelegram: contact.telegramUsername.trim().length > 0,
    locationUrl: contact.locationUrl?.trim() ?? "",
  };
}

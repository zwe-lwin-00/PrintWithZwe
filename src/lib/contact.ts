import type { ContactConfig } from "@/types/config";

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phoneTelLink(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return digits ? `tel:+${digits.replace(/^\+?/, "")}` : "";
}

export function telegramLink(username: string): string {
  const handle = username.replace(/^@/, "");
  return `https://t.me/${handle}`;
}

export function whatsappLink(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : "";
}

export function formatPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

export function telegramDisplay(username: string): string {
  const handle = username.replace(/^@/, "");
  return `@${handle}`;
}

export interface ContactLinks {
  phone: string;
  phoneTel: string;
  phoneDisplay: string;
  telegram: string;
  telegramDisplay: string;
  whatsapp: string;
  hasPhone: boolean;
  hasTelegram: boolean;
  hasWhatsapp: boolean;
}

export function buildContactLinks(contact: ContactConfig): ContactLinks {
  const phone = contact.phoneNumber?.trim() ?? "";
  const whatsapp = contact.whatsappNumber?.trim() || phone;

  return {
    phone,
    phoneTel: phoneTelLink(phone),
    phoneDisplay: formatPhoneDisplay(phone),
    telegram: telegramLink(contact.telegramUsername),
    telegramDisplay: telegramDisplay(contact.telegramUsername),
    whatsapp: whatsappLink(whatsapp),
    hasPhone: phone.length > 0,
    hasTelegram: contact.telegramUsername.trim().length > 0,
    hasWhatsapp: normalizePhoneDigits(whatsapp).length > 0,
  };
}

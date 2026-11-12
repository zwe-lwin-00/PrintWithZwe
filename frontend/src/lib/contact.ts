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

function tiktokLink(username: string): string {
  const handle = username.replace(/^@/, "").trim();
  return handle ? `https://www.tiktok.com/@${handle}` : "";
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

function tiktokDisplay(username: string): string {
  const handle = username.replace(/^@/, "").trim();
  return handle ? `@${handle}` : "";
}

export interface ContactLinks {
  phone: string;
  phoneTel: string;
  phoneDisplay: string;
  telegram: string;
  telegramDisplay: string;
  tiktok: string;
  tiktokDisplay: string;
  facebook: string;
  hasPhone: boolean;
  hasTelegram: boolean;
  hasTiktok: boolean;
  hasFacebook: boolean;
  locationUrl: string;
}

export function buildContactLinks(contact: ContactConfig): ContactLinks {
  const phone = contact.phoneNumber?.trim() ?? "";
  const tiktokUsername = contact.tiktokUsername?.trim() ?? "";
  const facebook = contact.facebookUrl?.trim() ?? "";

  return {
    phone,
    phoneTel: phoneTelLink(phone),
    phoneDisplay: formatPhoneDisplay(phone),
    telegram: telegramLink(contact.telegramUsername),
    telegramDisplay: telegramDisplay(contact.telegramUsername),
    tiktok: tiktokLink(tiktokUsername),
    tiktokDisplay: tiktokDisplay(tiktokUsername),
    facebook,
    hasPhone: phone.length > 0,
    hasTelegram: contact.telegramUsername.trim().length > 0,
    hasTiktok: tiktokUsername.replace(/^@/, "").length > 0,
    hasFacebook: facebook.length > 0,
    locationUrl: contact.locationUrl?.trim() ?? "",
  };
}

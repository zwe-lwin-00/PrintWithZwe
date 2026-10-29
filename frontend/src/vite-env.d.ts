/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_USERNAME?: string;
  readonly VITE_PHONE_NUMBER?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_MESSENGER_PAGE_ID?: string;
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_BRAND_TAGLINE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

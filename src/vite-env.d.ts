/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_USERNAME?: string;
  readonly VITE_PHONE_NUMBER?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_MESSENGER_PAGE_ID?: string;
  readonly VITE_APPS_SCRIPT_URL?: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_MOCK_ADMIN_PASSWORD?: string;
  readonly VITE_MOCK_PRODUCTS_URL?: string;
  readonly VITE_PRICING_BASE_FEE?: string;
  readonly VITE_PRICING_MACHINE_RATE?: string;
  readonly VITE_PRICING_CURRENCY?: string;
  readonly VITE_PRICING_LOCALE?: string;
  readonly VITE_PRICING_MATERIALS?: string;
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_BRAND_TAGLINE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

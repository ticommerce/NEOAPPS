// Identidad del producto. Cambiar el nombre aquí lo cambia en todo el sitio.
export const site = {
  name: "NeoAPPS Recepción",
  shortName: "Recepción",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  // Solo dígitos, con código de país. Se usa en los botones de WhatsApp.
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
} as const;

// Idiomas disponibles. Para agregar inglés: crear messages/en.json con las
// mismas claves que es.json, agregar "en" aquí y resolver el idioma del
// visitante en src/i18n/request.ts.
export const locales = ["es"] as const;
export const defaultLocale = "es";
export type Locale = (typeof locales)[number];

export function whatsappLink(text: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

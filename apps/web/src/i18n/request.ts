import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "@/config/site";

// Por ahora el sitio solo se sirve en español. Al agregar otro idioma, aquí
// se decide cuál usar (por ejemplo leyendo una cookie o el prefijo de la URL).
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "America/Costa_Rica",
  };
});

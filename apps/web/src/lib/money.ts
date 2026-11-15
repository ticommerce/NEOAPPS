// Los precios se guardan como enteros en la unidad mínima (céntimos).

export function formatMoney(cents: number, currency = "CRC", locale = "es-CR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// Convierte lo que escribe una persona ("3500", "3 500", "3.500,50", "12.50")
// a céntimos. Devuelve null si no es un monto válido.
export function parseMoneyToCents(input: string): number | null {
  let s = input.trim().replace(/[₡$\s]/g, "");
  if (s === "") return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const decimalAt = Math.max(lastComma, lastDot);
  if (decimalAt !== -1) {
    const decimals = s.length - decimalAt - 1;
    const separators = (s.match(/[.,]/g) ?? []).length;
    // Un único separador seguido de exactamente 3 dígitos es separador de miles.
    const isThousands = decimals === 3 && separators >= 1 && !(lastComma !== -1 && lastDot !== -1);
    if (isThousands || decimals === 0) {
      s = s.replace(/[.,]/g, "");
    } else if (decimals <= 2) {
      s = s.slice(0, decimalAt).replace(/[.,]/g, "") + "." + s.slice(decimalAt + 1);
    } else {
      return null;
    }
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return Number.isSafeInteger(cents) && cents <= 2_000_000_000 ? cents : null;
}

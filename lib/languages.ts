export const languageCodes = ["de", "ru", "en", "uk"] as const;
export type Lang = (typeof languageCodes)[number];
export const languageLabels: Record<Lang, string> = {
  de: "Deutsch",
  ru: "Русский",
  en: "English",
  uk: "Українська",
};
export const locales: Record<Lang, string> = {
  de: "de-DE",
  ru: "ru-RU",
  en: "en-GB",
  uk: "uk-UA",
};
export function isLanguage(value: unknown): value is Lang {
  return (
    typeof value === "string" && languageCodes.some((code) => code === value)
  );
}
export function browserLanguage(value: string): Lang {
  const code = value.toLowerCase().split(/[-_]/)[0];
  return isLanguage(code) ? code : "en";
}

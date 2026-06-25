export const locales = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'tl', label: 'Filipino', native: 'Filipino' },
  { code: 'ceb', label: 'Cebuano', native: 'Cebuano' },
  { code: 'ilo', label: 'Ilocano', native: 'Iloko' },
  { code: 'hil', label: 'Hiligaynon', native: 'Hiligaynon' },
  { code: 'war', label: 'Waray', native: 'Waray' },
  { code: 'pam', label: 'Kapampangan', native: 'Kapampangan' },
  { code: 'bik', label: 'Bicolano', native: 'Bikol' },
];

export const localeCodes = locales.map(l => l.code);
export const defaultLocale = 'en';
/**
 * Photos of Kuwait from Wikimedia Commons (free licences). Served at 1920 px by Wikimedia's
 * thumbnail service; their credits are listed on the Mentions légales page, as the licences ask.
 */
export type CreditedPhoto = { uri: string; title: string; author: string; license: string; licenseUrl: string; page: string };

const commons = (path: string, file: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/1920px-${file}`;

export const PHOTOS = {
  kuwaitSunset: {
    uri: commons('c/c3', 'Kuwait_City_Sunset_View.jpg'),
    title: 'Kuwait City Sunset View',
    author: 'Lana71',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    page: 'https://commons.wikimedia.org/wiki/File:Kuwait_City_Sunset_View.jpg',
  },
  kuwaitTowersDusk: {
    uri: commons('c/c3', 'Kuwait_tower_at_dusk.jpg'),
    title: 'Kuwait tower at dusk',
    author: 'Samarstha45',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    page: 'https://commons.wikimedia.org/wiki/File:Kuwait_tower_at_dusk.jpg',
  },
} satisfies Record<string, CreditedPhoto>;

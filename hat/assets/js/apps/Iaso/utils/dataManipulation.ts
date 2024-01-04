import { Locale } from '../types/general';

// Will not work with nested objects as their value will be "[object Object]"
export const convertObjectToString = (value: Record<string, unknown>): string =>
    Object.entries(value)
        .map(([key, entry]) => `${key}-${String(entry)}`)
        .toString();

export const stringToBoolean = (str: string): boolean | undefined => {
    if (str === 'true') return true;
    if (str === 'false') return false;
    return undefined;
};

export const determineSeparatorsFromLocale = (
    activeLocale: Locale,
): { thousand: '.' | ','; decimal: '.' | ',' } => {
    // using a switch to add more locales easily
    switch (activeLocale.code) {
        case 'fr':
            return { thousand: '.', decimal: ',' };
        case 'en':
            return { thousand: ',', decimal: '.' };
        default:
            return { thousand: ',', decimal: '.' };
    }
};

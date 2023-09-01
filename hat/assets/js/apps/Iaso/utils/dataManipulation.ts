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

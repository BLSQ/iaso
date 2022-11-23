// Will not work with nested objects as their value will be "[object Object]"
export const convertObjectToString = (value: Record<string, unknown>): string =>
    Object.entries(value)
        .map(([key, entry]) => `${key}-${String(entry)}`)
        .toString();

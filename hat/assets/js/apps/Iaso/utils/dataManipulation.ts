// Will not work with non serializable values like functions, but should work with most if not all our API responses
export const deepCopy = <T>(object: T): T => JSON.parse(JSON.stringify(object));

// Will not work with nested objects as their value will be "[object Object]"
export const convertObjectToString = (value: Record<string, unknown>): string =>
    Object.entries(value)
        .map(([key, entry]) => `${key}-${String(entry)}`)
        .toString();

export const pickObjectEntriesByKeys = (
    keys: string[],
    obj: Record<string, unknown>,
): Record<string, unknown> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => keys.includes(key)),
    );
};

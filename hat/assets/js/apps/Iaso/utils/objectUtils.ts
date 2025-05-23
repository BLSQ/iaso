/**
 * Maps an object's entries to a new object using a specified value key.
 * @param obj - The source object to map
 * @param valueKey - The key to extract from each value
 * @param startValue - The initial value for the accumulator (defaults to empty object)
 * @returns A new object with mapped values
 */
export const mapObject = <
    T extends Record<string, any>,
    K extends keyof T[keyof T],
>(
    obj: T,
    valueKey: K,
    startValue: Record<string, T[keyof T][K]> = {},
): Record<string, T[keyof T][K]> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] = value[valueKey];
        return acc;
    }, startValue);
};

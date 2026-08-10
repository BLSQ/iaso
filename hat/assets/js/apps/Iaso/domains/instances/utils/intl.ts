/**
 * bluesquare-components types `formatMessage` values as
 * `Record<string, string | HTMLElement>`, but the react-intl call underneath
 * accepts numbers — and ICU plural rules (`{count, plural, ...}`) only select
 * correctly when the value really is a number, not a stringified one.
 *
 * Use this to pass numeric values through without widening the wrapper's type.
 */
export const numericValues = (
    values: Record<string, number>,
): Record<string, string> => values as unknown as Record<string, string>;

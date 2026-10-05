// A `useSafeIntl()` for tests mocking bluesquare-components, rendering the messages' `defaultMessage`:
//
//     vi.mock('bluesquare-components', async () => ({
//         ...(await vi.importActual('bluesquare-components')),
//         useSafeIntl: (await import('<relative path>/tests/mocks/safeIntl')).mockUseSafeIntl,
//     }));
//
// (`vi.mock` being hoisted above the imports, the helper is imported inside the factory)

// The message's `defaultMessage`, its `{name}` placeholders filled in with `values`
export const mockFormatMessage = (
    message: { defaultMessage?: string },
    values?: Record<string, unknown>,
): string =>
    Object.entries(values ?? {}).reduce(
        (text, [key, value]) => text.replace(`{${key}}`, String(value)),
        message?.defaultMessage ?? '',
    );

export const mockUseSafeIntl = () => ({ formatMessage: mockFormatMessage });

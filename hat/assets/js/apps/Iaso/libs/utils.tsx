export const makeUrlWithParams = (
    url: string,
    urlParams: Record<string, unknown>,
): string => {
    const activeParams = Object.entries(urlParams).filter(
        ([_key, value]) => value !== undefined,
    );
    // @ts-ignore
    const queryString = new URLSearchParams(Object.fromEntries(activeParams));

    return `${url}?${queryString.toString()}`;
};

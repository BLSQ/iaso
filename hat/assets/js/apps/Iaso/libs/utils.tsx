/**
 * Get request with params passed as query params
 * Remove undefined params
 * @param {string} url
 * @param {{[p: string]: T}} params
 */
export const makeUrlWithParams = (
    url: string,
    urlParams: Record<string, unknown>,
): string => {
    // @ts-ignore
    const urlSearchParams = new URLSearchParams();

    Object.entries(urlParams).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            v.forEach(p => urlSearchParams.append(k, p));
        } else if (v !== undefined) {
            urlSearchParams.append(k, v);
        }
    });

    return `${url}/?${urlSearchParams.toString()}`;
};

export const paginationPathParams = ['order', 'pageSize', 'page'];

export const getNonPrefixedParams = (
    prefix: string,
    params: Record<string, any>,
    keysToIgnore: string[] = [],
) => {
    const nonPrefixedParams: Record<string, any> = {};
    Object.keys(params).forEach(key => {
        if (!key.startsWith(prefix) && !keysToIgnore.includes(key)) {
            nonPrefixedParams[key] = params[key];
        }
    });
    return nonPrefixedParams;
};
export const getPrefixedParams = (
    prefix: string,
    params: Record<string, any>,
) => {
    const reportParams: Record<string, any> = {};
    Object.keys(params).forEach(key => {
        if (key.startsWith(prefix)) {
            reportParams[key] = params[key];
        }
    });
    return reportParams;
};

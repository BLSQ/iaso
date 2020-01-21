const getTableUrl = (
    urlKey,
    params,
    toExport = false,
    exportType = 'csv',
    asLocation = false,
    asSmallDict = false,
) => {
    let url = `/api/${urlKey}/?`;
    const clonedParams = { ...params };

    if (toExport) {
        clonedParams[exportType] = true;
    }

    if (asLocation) {
        clonedParams.asLocation = true;
        clonedParams.limit = clonedParams.locationLimit;
        delete clonedParams.page;
    }

    if (asSmallDict) {
        clonedParams.limit = clonedParams.locationLimit;
        delete clonedParams.page;
    }


    delete clonedParams.locationLimit;

    Object.keys(clonedParams).forEach((key) => {
        const value = clonedParams[key];
        if (value && !url.includes(key)) {
            url += `&${key}=${value}`;
        }
    });

    return url;
};

export const getMultiSearchUrl = (
    urlKey,
    params,
    toExport = false,
    exportType = 'csv',
    asLocation = false,
    asSmallDict = false,
) => {
    let url = `/api/${urlKey}/?`;
    const clonedParams = { ...params };

    if (toExport) {
        clonedParams[exportType] = true;
    }

    if (asLocation) {
        clonedParams.asLocation = true;
        clonedParams.limit = clonedParams.locationLimit;
        delete clonedParams.page;
    }

    if (asSmallDict) {
        clonedParams.limit = clonedParams.locationLimit;
        delete clonedParams.page;
    }


    delete clonedParams.locationLimit;

    Object.keys(clonedParams).forEach((key) => {
        const value = clonedParams[key];
        if (value && !url.includes(key)) {
            url += `&${key}=${value}`;
        }
    });

    return url;
};


export default getTableUrl;

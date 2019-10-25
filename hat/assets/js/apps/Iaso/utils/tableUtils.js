const getTableUrl = (
    urlKey,
    params,
    toExport = false,
    exportType = 'csv',
    asLocation = false,
) => {
    let url = `/api/${urlKey}/?`;
    const clonedParams = { ...params };

    if (toExport) {
        clonedParams[exportType] = true;
    }

    if (asLocation) {
        clonedParams.asLocation = true;
        delete clonedParams.limit;
        delete clonedParams.page;
    }


    Object.keys(clonedParams).forEach((key) => {
        const value = clonedParams[key];
        if (value && !url.includes(key)) {
            url += `&${key}=${value}`;
        }
    });

    return url;
};

export default getTableUrl;

export const getUrl = (key, params) => {
    let url = `/api/${key}/?`;
    Object.keys(params).forEach(paramKey => {
        const value = params[paramKey];
        if (value && !url.includes(paramKey)) {
            url += `&${paramKey}=${value}`;
        }
    });
    return url;
};

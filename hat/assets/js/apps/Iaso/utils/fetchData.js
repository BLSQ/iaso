export function createUrl(params, url = '/charts') {
    // Create a url from an params object
    // e.g.: `{foo: 11, bar: 22} => '/foo/11/bar/22'`
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value) {
            url += `/${key}/${value}`; // eslint-disable-line
        }
    });
    return url;
}

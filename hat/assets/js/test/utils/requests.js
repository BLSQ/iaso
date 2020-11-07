const nock = require('nock');

const defautlHeader = {
    reqheaders: { 'Content-Type': 'application/json' },
};
const baseUrl = 'http://localhost:80';
export const mockPutRequest = (url, result = [], headers = defautlHeader) => {
    return nock(baseUrl, headers).put(url).reply(200, result);
};

export const mockPostRequest = (url, result = [], headers = defautlHeader) => {
    return nock(baseUrl, headers).post(url).reply(200, result);
};
export const mockPostRequestError = (
    url,
    result = {},
    headers = defautlHeader,
) => {
    return nock(baseUrl, headers).post(url).reply(400, result);
};

export const mockGetRequest = (url, result = []) => {
    return nock(baseUrl).get(url).reply(200, result);
};

export const mockDeleteRequest = (
    url,
    result = [],
    headers = defautlHeader,
) => {
    return nock(baseUrl, headers).delete(url).reply(200, result);
};

export const mockGetRequestsList = requests => {
    requests.forEach(r => {
        mockGetRequest(r.url, r.result, r.onSuccess);
    });
};

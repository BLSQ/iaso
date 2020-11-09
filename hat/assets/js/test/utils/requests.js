const nock = require('nock');

const baseUrl = 'http://localhost:80';
export const mockPutRequest = (url, body = []) => {
    return nock(baseUrl)
        .put(url, () => true)
        .reply(200, body);
};

export const mockPostRequest = (url, body = []) => {
    return nock(baseUrl)
        .post(url, () => true)
        .reply(200, body);
};

export const mockPostRequestError = url => {
    return nock(baseUrl)
        .post(url, () => true)
        .replyWithError({});
};

export const mockGetRequest = (url, body = []) => {
    return nock(baseUrl)
        .get(url, () => true)
        .reply(200, body);
};

export const mockDeleteRequest = (url, body = []) => {
    return nock(baseUrl)
        .delete(url, () => true)
        .reply(200, body);
};
export const mockDeleteRequestError = url => {
    return nock(baseUrl)
        .delete(url, () => true)
        .replyWithError({});
};

export const mockGetRequestsList = requests => {
    requests.forEach(r => {
        mockGetRequest(r.url, r.body, r.onSuccess);
    });
};

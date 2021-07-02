const nock = require('nock');

const baseUrl = 'http://localhost:80';
export const mockPutRequest = (url, body = []) => {
    return nock(baseUrl)
        .put(url, () => true)
        .reply(200, body);
};
/**
 *
 * @deprecated Use mockRequest instead
 */
export const mockPostRequest = (url, body = []) => {
    return nock(baseUrl)
        .post(url, () => true)
        .reply(200, body);
};

/**
 * @deprecated Use mockRequestError instead
 */
export const mockPostRequestError = url => {
    return nock(baseUrl)
        .post(url, () => true)
        .replyWithError({});
};
/**
 * @deprecated Use mockRequest instead
 */
export const mockGetRequest = (url, body = []) => {
    return nock(baseUrl)
        .get(url, () => true)
        .reply(200, body);
};
/**
 * @deprecated Use mockRequest instead
 */
export const mockDeleteRequest = (url, body = []) => {
    return nock(baseUrl)
        .delete(url, () => true)
        .reply(200, body);
};
/**
 * @deprecated Use mockRequestError instead
 */
export const mockDeleteRequestError = url => {
    return nock(baseUrl)
        .delete(url, () => true)
        .replyWithError({});
};

export const mockGetRequestsList = requests => {
    requests.forEach(r => {
        mockGetRequest(r.url, r.body);
    });
};

export const mockRequestError = (
    requestType,
    url,
    message,
    expectedRequest,
) => {
    const request = nock(baseUrl);
    let response;
    switch (requestType) {
        case 'get':
            response = request.get(url, expectedRequest || (() => true));
            break;
        case 'post':
            response = request.post(url, expectedRequest || (() => true));
            break;
        case 'put':
            response = request.put(url, expectedRequest || (() => true));
            break;
        case 'patch':
            response = request.patch(url, expectedRequest || (() => true));
            break;
        case 'delete':
            response = request.delete(url, expectedRequest || (() => true));
            break;
        case 'restore':
            response = request.patch(url, expectedRequest || (() => true));
            break;
        default:
            throw new Error(
                "unknown request type. Should be: 'get', 'post','put','patch', restore',or 'delete'",
            );
    }
    response.replyWithError({
        message,
    });
};

export const mockRequest = (requestType, url, body = [], expectedRequest) => {
    const request = nock(baseUrl);
    let response;
    switch (requestType) {
        case 'get':
            response = request.get(url, expectedRequest || (() => true));
            break;
        case 'post':
            response = request.post(url, expectedRequest || (() => true));
            break;
        case 'put':
            response = request.put(url, expectedRequest || (() => true));
            break;
        case 'patch':
            response = request.patch(url, expectedRequest || (() => true));
            break;
        case 'delete':
            response = request.delete(url, expectedRequest || (() => true));
            break;
        case 'restore':
            response = request.patch(url, expectedRequest || (() => true));
            break;
        default:
            throw new Error(
                "unknown request type. Should be: 'get', 'post','put','patch', 'restore',or 'delete'",
            );
    }
    response.reply(200, body);
};

// create timeout to simulate async call
// credit https://stackoverflow.com/questions/51200626/using-a-settimeout-in-a-async-function
export const waitFor = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

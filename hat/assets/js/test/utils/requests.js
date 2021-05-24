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

export const mockRequestError = (requestType, url, message) => {
    const request = nock(baseUrl);
    let response;
    switch (requestType) {
        case 'get':
            response = request.get(url, () => true);
            break;
        case 'post':
            response = request.post(url, () => true);
            break;
        case 'put':
            response = request.put(url, () => true);
            break;
        case 'patch':
            response = request.patch(url, () => true);
            break;
        case 'delete':
            response = request.delete(url, () => true);
            break;
        case 'restore':
            response = request.patch(url, () => true);
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

export const mockRequest = (requestType, url, body = []) => {
    const request = nock(baseUrl);
    let response;
    switch (requestType) {
        case 'get':
            response = request.get(url, () => true);
            break;
        case 'post':
            response = request.post(url, () => true);
            break;
        case 'put':
            response = request.put(url, () => true);
            break;
        case 'patch':
            response = request.patch(url, () => true);
            break;
        case 'delete':
            response = request.delete(url, () => true);
            break;
        case 'restore':
            response = request.patch(url, () => true);
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

const nock = require('nock');

export const mockPutRequest = (
    url,
    result = [],
    spy = () => null,
    error = false,
) => {
    const onReply = () => {
        spy();
        return result;
    };
    if (!error) {
        nock('http://localhost:80').put(url).reply(200, onReply());
    }
    nock('http://localhost:80').put(url).replyWithError(500);
};
export const mockPostRequest = (
    url,
    result = [],
    spy = () => null,
    error = false,
) => {
    const onReply = () => {
        spy();
        return result;
    };
    if (!error) {
        nock('http://localhost:80').post(url).reply(200, onReply());
    }
    nock('http://localhost:80').post(url).replyWithError(500);
};

export const mockGetRequest = (url, result = [], spy = () => null) => {
    const onReply = () => {
        spy();
        return result;
    };
    nock('http://localhost:80').get(url).reply(200, onReply());
};

export const mockDeleteRequest = (url, result = [], spy = () => null) => {
    const onReply = () => {
        spy();
        return result;
    };
    nock('http://localhost:80').delete(url).reply(200, onReply());
};
export const mockGetRequestsList = requests => {
    requests.forEach(r => {
        mockGetRequest(r.url, r.result, r.onSuccess);
    });
};

export const mockPutRequest2 = (url, spy, error = false) => {
    const onReply = () => {
        return spy();
    };
    if (!error) {
        nock('http://localhost:80').put(url).reply(200, onReply());
    }
    nock('http://localhost:80').put(url).replyWithError(500);
};

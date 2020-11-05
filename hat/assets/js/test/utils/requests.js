const nock = require('nock');

export const mockPutRequest = (url, result = [], spy = () => null) => {
    const onReply = () => {
        spy();
        return result;
    };
    nock('http://localhost:80').put(url).reply(200, onReply());
};
export const mockPostRequest = (url, result = [], spy = () => null) => {
    const onReply = () => {
        spy();
        return result;
    };
    nock('http://localhost:80').post(url).reply(200, onReply());
};

export const mockGetRequest = (url, result = [], spy = () => null) => {
    const onReply = () => {
        spy();
        return result;
    };
    nock('http://localhost:80').get(url).reply(200, onReply());
};

export const mockGetRequestsList = requests => {
    requests.forEach(r => {
        mockGetRequest(r.url, r.result, r.onSuccess);
    });
};

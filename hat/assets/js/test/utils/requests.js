const nock = require('nock');

export const mockGetRequest = (url, result = [], spy = () => null) => {
    const onReply = () => {
        spy();
        return result;
    };
    nock('http://localhost:80').get(url).reply(200, onReply());
};

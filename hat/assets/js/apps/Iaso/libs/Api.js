const req = require('superagent');

export const getRequest = url => req
    .get(url)
    .then(result => result.body)
    .catch((err) => {
        console.error(`Error while fetching ${url}: ${err}`);
    });


export const postRequest = (url, data) => req
    .post(url)
    .set('Content-Type', 'application/json')
    .send(data)
    .then(result => result.body)
    .catch((error) => {
        console.error(`Error when posting ${url}: ${error}`);
    });

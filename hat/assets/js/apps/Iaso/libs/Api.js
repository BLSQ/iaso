const req = require('superagent');

export const getRequest = url => req
    .get(url)
    .then(result => result.body)
    .catch((error) => {
        console.error(`Error while fetching ${url}: ${error}`);
        throw error;
    });


export const postRequest = (url, data) => req
    .post(url)
    .set('Content-Type', 'application/json')
    .send(data)
    .then(result => result.body)
    .catch((error) => {
        console.error(`Error when posting ${url}: ${error}`);
        throw error;
    });


export const patchRequest = (url, data) => req
    .patch(url)
    .set('Content-Type', 'application/json')
    .send(data)
    .then(result => result.body)
    .catch((error) => {
        console.error(`Error when patching ${url}: ${error}`);
        throw error;
    });

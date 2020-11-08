const req = require('superagent');

class ApiError extends Error {
    constructor(message, response) {
        super(message);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }

        this.name = 'ApiError';
        // Custom debugging information
        if (response) {
            this.status = response.status;
            this.details = response.body;
        }
    }
}

export const getRequest = url =>
    req
        .get(url)
        .then(result => result.body)
        .catch(error => {
            console.error(`Error while fetching ${url}: ${error}`);
            throw error;
        });

export const postRequest = (url, data, fileData = {}) => {
    let request = req.post(url);
    if (Object.keys(fileData).length > 0) {
        // multipart mode
        Object.entries(data).forEach(([key, value]) => {
            request = request.field(key, value);
        });
        Object.entries(fileData).forEach(([key, value]) => {
            request = request.attach(key, value);
        });
    } else {
        // standard json mode
        request = request.set('Content-Type', 'application/json').send(data);
    }

    return request
        .then(result => result.body)
        .catch(error => {
            throw new ApiError(error.message, error.response);
        });
};

export const patchRequest = (url, data) =>
    req
        .patch(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(result => result.body)
        .catch(error => {
            console.error(`Error when patching ${url}: ${error}`);
            throw new ApiError(error.message, error.response);
        });

export const deleteRequest = url =>
    req
        .delete(url)
        .set('Content-Type', 'application/json')
        .then(() => true)
        .catch(error => {
            console.error(`Error when deleting ${url}: ${error}`);
            throw error;
        });

export const putRequest = (url, data) =>
    req
        .put(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(result => result.body)
        .catch(error => {
            console.error(`Error when put ${url}: ${error}`);
            throw new ApiError(error.message, error.response);
        });

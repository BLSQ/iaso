export class ApiError extends Error {
    constructor(message, response, json) {
        super(message);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }

        this.name = 'ApiError';
        // Custom debugging information
        if (response) {
            this.status = response.status;
        }
        // Details is used by forms to display errors beside fields
        this.details = json;
    }
}

const tryJson = async response => {
    try {
        return await response.json();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log('could not parse', e, response);
        return undefined;
    }
};

// fetch throw on network error but not bad status code
// so throw manually since the code expect it.
// Wrap all errors in ApiError.
const iasoFetch = async (resource, init = undefined) => {
    let response;
    const url = resource.url ?? resource;
    const method = init?.ignoreMethod ?? 'GET';
    try {
        response = await fetch(resource, init);
    } catch (error) {
        console.error(error);
        throw new ApiError(error.message);
    }
    if (!response.ok) {
        console.error(`Error on  ${method}  ${url}  status ${response.status}`);
        const json = await tryJson(response);
        throw new ApiError(`Error on ${method} ${url} `, response, json);
    }
    return response;
};

export const getRequest = url =>
    iasoFetch(url).then(response => response.json());

export const postRequest = (url, data, fileData = {}) => {
    // Send as form if files included else in JSON
    let init;

    if (Object.keys(fileData).length > 0) {
        const formData = new FormData();
        // multipart mode
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        Object.entries(fileData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        init = { method: 'POST', body: formData };
    } else {
        // standard json mode
        init = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    return iasoFetch(url, init).then(response => response.json());
};

export const patchRequest = (url, data) =>
    iasoFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }).then(response => response.json());

export const deleteRequest = url =>
    iasoFetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    }).then(() => true);

export const restoreRequest = url =>
    iasoFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({
            deleted_at: null,
        }),
        headers: { 'Content-Type': 'application/json' },
    }).then(() => true);

export const putRequest = (url, data) =>
    iasoFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    }).then(response => response.json());

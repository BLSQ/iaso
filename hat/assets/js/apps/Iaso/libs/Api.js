import { FETCHING_ABORTED } from './constants';

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
export const iasoFetch = async (resource, init = {}) => {
    let response;
    const url = resource.url ?? resource;
    const method = init?.method ?? 'GET';
    try {
        // await waitFor(5000);
        response = await fetch(resource, init);
    } catch (error) {
        // ignoring errors from cancelled fetch
        if (error.name !== 'AbortError') {
            console.error(error);
            throw new ApiError(error.message);
        }
        // Don't error on cancel fetch
        const emptyRes = new Response(
            JSON.stringify({ message: FETCHING_ABORTED }),
        );
        return emptyRes;
    }
    if (!response.ok) {
        console.error(`Error on  ${method}  ${url}  status ${response.status}`);
        const json = await tryJson(response);
        throw new ApiError(`Error on ${method} ${url} `, response, json);
    }
    return response;
};

export const getRequest = async (url, signal) => {
    return iasoFetch(url, { signal }).then(response => {
        return response.json();
    });
};

export const postRequest = (url, data, fileData = {}, signal) => {
    // Send as form if files included else in JSON
    let init = {};

    if (Object.keys(fileData).length > 0) {
        const formData = new FormData();
        // multipart mode
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        Object.entries(fileData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        init = { method: 'POST', body: formData, signal };
    } else {
        // standard json mode
        init = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            signal,
        };
    }

    return iasoFetch(url, init).then(response => response.json());
};

export const patchRequest = (url, data, signal) =>
    iasoFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        signal,
    }).then(response => response.json());

export const deleteRequest = (url, signal) =>
    iasoFetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        signal,
    }).then(() => true);

export const restoreRequest = (url, signal) =>
    iasoFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({
            deleted_at: null,
        }),
        headers: { 'Content-Type': 'application/json' },
        signal,
    }).then(() => true);

export const putRequest = (url, data, signal) =>
    iasoFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        signal,
    }).then(response => response.json());

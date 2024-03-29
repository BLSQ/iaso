/* eslint-disable camelcase */
import { PostArg } from '../types/general';
import { Nullable, Optional } from '../types/utils';
import { FETCHING_ABORTED } from './constants';

export class ApiError extends Error {
    private status: any;

    public details: any;

    constructor(
        message: string,
        response?: Response,
        json?: Record<string, any>,
    ) {
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
export const iasoFetch = async (
    resource: RequestInfo,
    init: RequestInit = {},
): Promise<Response> => {
    let response;
    const url =
        typeof resource === 'string' ? resource : resource.url ?? resource;
    const method = init?.method ?? 'GET';
    try {
        response = await fetch(resource, {
            ...init,
            credentials: 'same-origin',
        });
    } catch (error) {
        // ignoring errors from cancelled fetch
        if (error.name !== 'AbortError') {
            throw new ApiError(error.message);
        }
        // Don't error on cancel fetch
        const emptyRes = new Response(
            JSON.stringify({ message: FETCHING_ABORTED }),
        );
        return emptyRes;
    }
    if (!response.ok) {
        if (response.status === 401) {
            const currentPath = encodeURIComponent(
                window.location.pathname + window.location.search,
            );
            const loginUrl = `/login/?next=${currentPath}`;
            window.location.href = loginUrl;
            return Promise.reject(
                new ApiError('Redirecting to login', response),
            );
        }
        const json = await tryJson(response);
        throw new ApiError(`Error on ${method} ${url} `, response, json);
    }
    return response;
};

export const getRequest = async (
    url: string,
    signal?: Nullable<AbortSignal>,
): Promise<any> => {
    return iasoFetch(url, { signal }).then(response => {
        return response.json();
    });
};

export const basePostRequest = (
    url: string,
    data: Record<string, any> = {},
    fileData: Optional<Record<string, Blob | Blob[]>> = {},
    signal?: Nullable<AbortSignal>,
): Promise<any> => {
    // Send as form if files included else in JSON
    let init: Record<string, unknown> = {};
    if (Object.keys(fileData).length > 0) {
        const formData = new FormData();
        // multipart mode
        Object.entries(data).forEach(([key, value]) => {
            let converted_value = value;
            if (typeof converted_value === 'object') {
                converted_value = JSON.stringify(converted_value);
            }
            formData.append(key, converted_value);
        });
        Object.entries(fileData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(file => formData.append(key, file));
            } else {
                formData.append(key, value);
            }
        });
        init = {
            method: 'POST',
            body: formData,
            signal,
        };
    } else {
        // standard json mode
        init = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            signal,
        };
    }

    return iasoFetch(url, init).then(response => {
        if (response.status === 204) {
            return null;
        }
        return response.json();
    });
};

export const postRequest = (
    arg1: string | PostArg,
    arg2?: Record<string, any>,
    arg3?: Record<string, Blob | Blob[]>,
    arg4?: AbortSignal | null,
): Promise<any> => {
    if (typeof arg1 === 'string') {
        return basePostRequest(arg1, arg2, arg3, arg4);
    }
    return basePostRequest(arg1.url, arg1.data, arg1.fileData, arg1.signal);
};

export const patchRequest = (
    url: string,
    data: unknown,
    signal?: Nullable<AbortSignal>,
): Promise<any> =>
    iasoFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        signal,
    }).then(response => response.json());

export const deleteRequest = (
    url: string,
    signal?: Nullable<AbortSignal>,
): Promise<boolean> =>
    iasoFetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        signal,
    }).then(() => true);

export const restoreRequest = (
    url: string,
    signal?: Nullable<AbortSignal>,
): Promise<boolean> =>
    iasoFetch(url, {
        method: 'PATCH',
        body: JSON.stringify({
            deleted_at: null,
        }),
        headers: { 'Content-Type': 'application/json' },
        signal,
    }).then(() => true);

export const putRequest = (
    url: string,
    data: unknown,
    signal?: Nullable<AbortSignal>,
): Promise<any> =>
    iasoFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        signal,
    }).then(response => response.json());

export const optionsRequest = async (
    url: string,
    signal?: Nullable<AbortSignal>,
): Promise<any> => {
    return iasoFetch(url, {
        method: 'OPTIONS',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        signal,
    }).then(response => {
        return response.json();
    });
};

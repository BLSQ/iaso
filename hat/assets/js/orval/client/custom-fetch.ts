import * as Sentry from '@sentry/browser';
import moment from 'moment';
import { ApiError } from '../../apps/Iaso/libs/Api';
import { FETCHING_ABORTED } from '../../apps/Iaso/libs/constants';

const tryJson = async (response: any) => {
    try {
        return await response.json();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log('could not parse', e, response);
        return undefined;
    }
};

const getBody = <T>(c: Response | Request): Promise<T> => {
    const contentType = c.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
        return c.json();
    }

    if (contentType && contentType.includes('application/pdf')) {
        return c.blob() as Promise<T>;
    }

    return c.text() as Promise<T>;
};

const getHeaders = (headers?: HeadersInit): HeadersInit => {
    return {
        'Accept-Language': moment.locale(),
        ...headers,
    };
};

export const customFetchInstance = async <T>(
    url: string,
    options: RequestInit = {},
): Promise<T> => {
    let response;
    const { method = 'GET', headers = {}, ...newOptions } = options;

    try {
        response = await fetch(url, {
            method,
            headers: getHeaders(headers),
            ...newOptions,
        });
    } catch (error) {
        // ignoring errors from cancelled fetch
        if (error instanceof Error && error.name !== 'AbortError') {
            const apiError = new ApiError(error.message);
            if (Sentry?.withScope) {
                Sentry.withScope(scope => {
                    scope.setTag('type', 'api_error');
                    scope.setExtra('url', url);
                    scope.setExtra('method', method);
                    Sentry.captureException(apiError);
                });
            }
            throw apiError;
        }
        // Don't error on cancel fetch
        return new Response(JSON.stringify({ message: FETCHING_ABORTED })) as T;
    }

    if (!response.ok) {
        if (response.status === 401) {
            const currentPath = encodeURIComponent(
                window.location.pathname + window.location.search,
            );
            window.location.href = `/login/?next=${currentPath}`;
            return Promise.reject(
                new ApiError('Redirecting to login', response),
            );
        }
        const json = await tryJson(response);
        const apiError = new ApiError(
            `Error on ${method} ${url}`,
            response,
            json,
        );
        if (Sentry?.withScope) {
            Sentry.withScope(scope => {
                scope.setTag('type', 'api_error');
                scope.setExtra('url', url);
                scope.setExtra('method', method);
                scope.setExtra('status', response.status);
                scope.setExtra('response', json);
                Sentry.captureException(apiError);
            });
        }
        throw apiError;
    }
    if (response.status === 204) return null as T;
    return (await getBody<T>(response)) as T;
};

export default customFetchInstance;

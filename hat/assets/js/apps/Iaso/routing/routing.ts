import { useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { baseUrls } from '../constants/urls';
import { useParamsObject } from './hooks/useParamsObject';
import { convertObjectToUrlParams } from './utils';

// FIXME: delete - depredcated in react-router6
/* Modify the parameters for the current page and return the new url */
const genUrl = (
    router: Router,
    newParams: Record<string, string | number | null | undefined>,
): string =>
    // formatPattern(router.routes[0].path, { ...router.params, ...newParams });
    '/home';

export { genUrl };

export const useCurrentLocationWithParams = (
    newParams: Record<string, string | number | null | undefined>,
): string => {
    const { pathname } = useLocation();
    const currentBaseUrl = Object.values(baseUrls).find(url =>
        pathname.includes(url),
    );
    const currentParams = useParamsObject(currentBaseUrl ?? '');
    if (!currentBaseUrl) return '/home';
    const updatedParams = { ...currentParams, ...newParams };
    const paramsAsString = convertObjectToUrlParams(updatedParams);
    return `/${currentBaseUrl}${paramsAsString}`;
};

type GenUrlFunction = (
    // eslint-disable-next-line no-unused-vars
    newParams: Record<string, string | number | null | undefined>,
) => string;

export const useGenUrl = (): GenUrlFunction => {
    const { pathname } = useLocation();
    const currentBaseUrl = Object.values(baseUrls).find(url =>
        pathname.includes(url),
    );
    const currentParams = useParamsObject(currentBaseUrl ?? '');
    return useCallback(
        (
            newParams: Record<string, string | number | null | undefined>,
        ): string => {
            if (!currentBaseUrl) return '/home';
            const updatedParams = { ...currentParams, ...newParams };
            const paramsAsString = convertObjectToUrlParams(updatedParams);
            return `/${currentBaseUrl}${paramsAsString}`;
        },
        [currentBaseUrl, currentParams],
    );
};

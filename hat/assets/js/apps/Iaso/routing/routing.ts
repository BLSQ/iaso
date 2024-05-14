import { useLocation } from 'react-router-dom';
import { useCallback, useContext, useMemo } from 'react';
import { convertObjectToUrlParams } from 'bluesquare-components';
import { baseUrls, paramsConfig } from '../constants/urls';
import { useParamsObject } from './hooks/useParamsObject';
import { PluginsContext } from '../utils';
import { Plugin } from '../domains/app/types';

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

export const useParamsConfig = (): Record<string, string[]> => {
    const { plugins } = useContext(PluginsContext);
    return useMemo(() => {
        const result: Record<string, string[]> = { ...paramsConfig };
        plugins.forEach((plugin: Plugin) => {
            Object.assign(result, plugin.paramsConfig);
        });
        return result;
    }, [plugins]);
};

export const useBaseUrls = (): Record<string, string> => {
    const { plugins } = useContext(PluginsContext);
    return useMemo(() => {
        const result: Record<string, string> = { ...baseUrls };
        plugins.forEach((plugin: Plugin) => {
            Object.assign(result, plugin.baseUrls);
        });
        return result;
    }, [plugins]);
};

type GenUrlFunction = (
    // eslint-disable-next-line no-unused-vars
    newParams: Record<string, string | number | null | undefined>,
) => string;

export const useGenUrl = (): GenUrlFunction => {
    const { pathname } = useLocation();
    const allBaseUrls = useBaseUrls();
    // If several urls match, the correct one is the longest
    const currentBaseUrl =
        Object.values(allBaseUrls)
            .filter(url => pathname.includes(`${url}`))
            .sort((a, b) => a.length - b.length)[0] ?? baseUrls.home;
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

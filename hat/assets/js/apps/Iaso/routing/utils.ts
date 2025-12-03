import { createUrl } from 'bluesquare-components';
import { getColor } from 'Iaso/hooks/useGetColors';
import { baseUrls } from '../constants/urls';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';
import { cleanupParams } from '../utils/requests';

// TODO replace createUrl to avoid multiple methods with same use
export const getOrgUnitsUrl = (
    accountId: string | number,
    colors: string[],
): string =>
    `/${baseUrls.orgUnits}${createUrl(
        {
            accountId,
            locationLimit: locationLimitMax,
            order: 'id',
            pageSize: 50,
            page: 1,
            searchTabIndex: 0,
            searches: `[{"validation_status":"all", "color":"${getColor(
                0,
                colors,
            ).replace('#', '')}"}]`,
        },
        '',
    )}`;

export const makeQueryString = (params, tableDefaults) => {
    const searchParams = { ...cleanupParams(params) };
    delete searchParams.accountId;
    if (params?.order === undefined) {
        searchParams.order = tableDefaults.order;
    }
    if (params?.page === undefined) {
        searchParams.page = tableDefaults.page;
    }
    if (params?.pageSize === undefined) {
        searchParams.limit = tableDefaults.limit;
    } else {
        searchParams.limit = params.pageSize;
    }
    delete searchParams.pageSize;

    return new URLSearchParams(searchParams).toString();
};

export const decapitalize = (word: string): string => {
    const split = word.split('');
    if (split.length === 0) {
        return word;
    }
    const [first, ...rest] = split;
    return [first.toLocaleLowerCase(), ...rest].join('');
};

export const extractPrefixedParams = (
    prefix: string,
    params: Record<string, string>,
): Record<string, string> => {
    const newParams = { ...params };
    Object.keys(params)
        .filter(paramKey => paramKey.includes(prefix))
        .forEach(prefixedKey => {
            const [, upperCaseKey] = prefixedKey.split(prefix);
            const formattedKey = decapitalize(upperCaseKey);
            newParams[formattedKey] = newParams[prefixedKey];
            delete newParams[prefixedKey];
        });
    return newParams;
};

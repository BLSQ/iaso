import { createUrl } from 'bluesquare-components';
import { baseUrls } from '../constants/urls';
import { getChipColors } from '../constants/chipColors';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';
import { cleanupParams } from '../utils/requests';

// TODO replace createUrl to avoid multiple methods with same use
export const getOrgUnitsUrl = (accountId: string | number): string =>
    `/${baseUrls.orgUnits}${createUrl(
        {
            accountId,
            locationLimit: locationLimitMax,
            order: 'id',
            pageSize: 50,
            page: 1,
            searchTabIndex: 0,
            searches: `[{"validation_status":"all", "color":"${getChipColors(
                0,
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
    searchParams.all = true;

    return new URLSearchParams(searchParams).toString();
};

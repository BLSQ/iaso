// @ts-ignore
import { getTableUrl } from 'bluesquare-components';
import { OrgUnitParams } from '../types/orgUnit';
import { Search } from '../types/search';
import { getFromDateString, getToDateString } from '../../../utils/dates';

export type ApiParams = {
    order: string;
    page?: string;
    limit: string;
    searches: string;
    asLocation?: string;
    locationLimit: string;
};

type Result = {
    apiParams: ApiParams;
    getUrl: (
        // eslint-disable-next-line no-unused-vars
        toExport: boolean,
        // eslint-disable-next-line no-unused-vars
        exportType: string,
        // eslint-disable-next-line no-unused-vars
        asLocation?: boolean,
    ) => string;
};
export const useGetApiParams = (
    searches: [Search],
    params: OrgUnitParams,
    asLocation = false,
): Result => {
    const tempSearches = [...searches];
    searches.forEach((s, i) => {
        tempSearches[i].orgUnitParentId = searches[i].levels;
        tempSearches[i].dateFrom =
            getFromDateString(searches[i].dateFrom) || undefined;
        tempSearches[i].dateTo =
            getToDateString(searches[i].dateTo) || undefined;
    });

    const apiParams: ApiParams = {
        limit: params.pageSize ? params.pageSize : '20',
        order: params.order ? params.order : '-updated_at',
        page: params.page ? params.page : '1',
        searches: JSON.stringify(tempSearches),
        locationLimit: params.locationLimit,
    };

    if (asLocation) {
        apiParams.asLocation = 'true';
        apiParams.limit = apiParams.locationLimit;
        delete apiParams.page;
    }
    const getUrl = (toExport: boolean, exportType: string) =>
        getTableUrl('orgunits', apiParams, toExport, exportType, asLocation);
    return {
        apiParams,
        getUrl,
    };
};

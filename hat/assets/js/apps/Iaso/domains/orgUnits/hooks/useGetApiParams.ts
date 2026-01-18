import { getTableUrl } from 'bluesquare-components';
import { getFromDateString, getToDateString } from '../../../utils/dates';
import { OrgUnitParams } from '../types/orgUnit';
import { Search } from '../types/search';

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
        toExport: boolean,
        exportType: string,
        asLocation?: boolean,
    ) => string;
};
export const useGetApiParams = (
    searches: [Search],
    params: OrgUnitParams,
    asLocation = false,
): Result => {
    const activeSearches = searches.filter(s => !s.isAdded);
    const tempSearches = [...activeSearches];
    activeSearches.forEach((s, i) => {
        tempSearches[i].orgUnitParentId = activeSearches[i].levels;
        tempSearches[i].dateFrom =
            getFromDateString(activeSearches[i].dateFrom) || undefined;
        tempSearches[i].dateTo =
            getToDateString(activeSearches[i].dateTo) || undefined;
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

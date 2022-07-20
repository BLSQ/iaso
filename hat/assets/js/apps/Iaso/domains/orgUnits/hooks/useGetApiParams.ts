import { OrgUnitParams } from '../types/orgUnit';
import { Search } from '../types/search';
import { getFromDateString, getToDateString } from '../../../utils/dates';

type ApiParams = {
    order: string;
    page: string;
    searchTabIndex: string;
    limit: string;
    searches: string;
};
export const useGetApiParams = (
    searches: [Search],
    params: OrgUnitParams,
): ApiParams => {
    const tempSearches = [...searches];
    searches.forEach((s, i) => {
        tempSearches[i].orgUnitParentId = searches[i].levels;
        tempSearches[i].dateFrom =
            getFromDateString(searches[i].dateFrom) || undefined;
        tempSearches[i].dateTo =
            getToDateString(searches[i].dateTo) || undefined;
    });

    const urlParams = {
        searchTabIndex: params.searchTabIndex,
        limit: params.pageSize ? params.pageSize : '50',
        order: params.order ? params.order : '-updated_at',
        page: params.page ? params.page : '1',
        searches: JSON.stringify(tempSearches),
    };
    return urlParams;
};

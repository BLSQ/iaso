import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
// @ts-ignore
import { DropdownOptionsWithOriginal } from '../../../../types/utils';

import { staleTime } from '../../config';
import MESSAGES from '../../messages';

// TODO CODE REVIEW
// don't know why but useGetGroupDropdown endpoint
// version vs sourceVersionId

// Correspondance between the name in the filter object and what the API expect
const queryParamsMap = new Map([
    ['dataSourceId', 'dataSource'],
    ['sourceVersionId', 'version'],
    ['dataSourceIds', 'dataSourceIds'],
    ['sourceVersionIds', 'versionIds'],
    ['blockOfCountries', 'blockOfCountries'],
    ['appId', 'app_id'],
    ['projectIds', 'projectIds'],
    ['defaultVersion', 'defaultVersion'],
]);

type ApiParams = {
    dataSource?: number;
    version?: number;
    dataSourceIds?: string;
    versionIds?: string;
    blockOfCountries?: string;
    app_id?: string;
    defaultVersion?: string;
    projectIds?: string;
};
type Params = {
    dataSourceId?: number;
    dataSourceIds?: string;
    sourceVersionId?: number;
    sourceVersionIds?: string;
    blockOfCountries?: string | boolean;
    appId?: string;
    defaultVersion?: string;
    projectIds?: string;
};
export const useGetGroupDropdown = (
    params: Params,
    enabled = true,
): UseQueryResult<
    DropdownOptionsWithOriginal<
        number,
        { id: number; label: string; name: string }
    >[],
    Error
> => {
    const queryParams: ApiParams = {};
    queryParamsMap.forEach((keyInApi, keyInJS) => {
        if (params[keyInJS]) {
            queryParams[keyInApi] = params[keyInJS];
        }
    });
    if (
        !queryParams.version &&
        !queryParams.dataSource &&
        !queryParams.dataSourceIds &&
        !queryParams.versionIds &&
        !queryParams.defaultVersion
    ) {
        queryParams.defaultVersion = 'true';
    }
    // TS is unhappy with ids as numbers for URLSearchParams, but it works just fine
    // @ts-ignore
    const urlSearchParams = new URLSearchParams(queryParams);
    const queryString = urlSearchParams.toString();
    return useSnackQuery({
        queryKey: ['groups', queryString],
        queryFn: () => getRequest(`/api/groups/dropdown/?${queryString}`),
        snackErrorMsg: MESSAGES.fetchGroupsError,
        options: {
            enabled,
            staleTime,
            select: data => {
                if (!data) return [];
                return data.map(group => {
                    return {
                        value: group.id,
                        label: group.label,
                        original: group,
                    };
                });
            },
        },
    });
};

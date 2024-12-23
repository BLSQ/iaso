import { UseQueryResult } from 'react-query';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
import { DropdownOptions } from '../../../../types/utils';

import { staleTime } from '../../config';
import MESSAGES from '../../messages';

type Props = {
    dataSourceId?: number;
    sourceVersionId?: number;
    blockOfCountries?: string;
};

const makeGroupsQueryParams = ({
    dataSourceId,
    sourceVersionId,
    blockOfCountries,
}) => {
    if (sourceVersionId) return `?version=${sourceVersionId}`;
    if (dataSourceId) return `?dataSource=${dataSourceId}`;
    if (blockOfCountries) return `?blockOfCountries=${blockOfCountries}`;
    return '';
};

export const useGetGroups = ({
    dataSourceId,
    sourceVersionId,
    blockOfCountries,
}: Props): UseQueryResult<DropdownOptions<string>[], Error> => {
    const groupsQueryParams = makeGroupsQueryParams({
        dataSourceId,
        sourceVersionId,
        blockOfCountries,
    });

    return useSnackQuery({
        queryKey: ['groups', dataSourceId, groupsQueryParams],
        queryFn: () => getRequest(`/api/groups/${groupsQueryParams}`),
        snackErrorMsg: MESSAGES.fetchGroupsError,
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.groups.map(group => {
                    return {
                        value: group.id,
                        label: group.name,
                        original: group,
                    };
                });
            },
        },
    });
};

// TODO CODE REVIEW
// don't know why but useGetGroupDropdown endpoint
// version vs sourceVersionId

// Correspondance between the name in the filter object and what the API expect
const queryParamsMap = new Map([
    ['dataSourceId', 'dataSource'],
    ['sourceVersionId', 'version'],
    ['blockOfCountries', 'blockOfCountries'],
    ['appId', 'app_id'],
    ['projectIds', 'projectIds'],
    ['defaultVersion', 'defaultVersion'],
]);

type Params = {
    dataSourceId?: number;
    sourceVersionId?: number;
    blockOfCountries?: string;
    appId?: string;
    defaultVersion?: string;
    projectIds?: string;
};
export const useGetGroupDropdown = (
    params: Params,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const queryParams = {};
    queryParamsMap.forEach((keyInApi, keyInJS) => {
        if (params[keyInJS]) {
            queryParams[keyInApi] = params[keyInJS];
        }
    });
    const urlSearchParams = new URLSearchParams(queryParams);
    const queryString = urlSearchParams.toString();
    return useSnackQuery({
        queryKey: ['groups', queryString],
        queryFn: () => getRequest(`/api/groups/dropdown/?${queryString}`),
        snackErrorMsg: MESSAGES.fetchGroupsError,
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.map(group => {
                    return {
                        value: group.id,
                        label: group.name,
                        original: group,
                    };
                });
            },
        },
    });
};

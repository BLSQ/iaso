import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { apiUrl } from '../../constants';
import { OrgUnitType } from '../../types';
import { DropdownOptions } from '../../../../../types/utils';

export const useCheckAvailabilityOrgUnitChangeRequestConfigs = (
    projectId?: number,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const url = `${apiUrl}check_availability/?project_id=${projectId}`;
    return useSnackQuery({
        // Including locale in the query key because we need to make a call to update translations coming from the backend
        queryKey: ['checkAvailabilityOrgUnitChangeRequestConfigs', url],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(projectId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: data => {
                return (
                    data?.results?.map((orgUnitType: OrgUnitType) => {
                        return {
                            value: orgUnitType.id,
                            label: orgUnitType.name,
                        };
                    }) ?? []
                );
            },
        },
    });
};

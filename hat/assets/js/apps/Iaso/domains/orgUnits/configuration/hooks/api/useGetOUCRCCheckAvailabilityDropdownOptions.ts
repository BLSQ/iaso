import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { apiUrlOUCRCCheckAvailability } from '../../constants';
import { OrgUnitType } from '../../types';
import { DropdownOptions } from '../../../../../types/utils';

export const useGetOUCRCCheckAvailabilityDropdownOptions = (
    projectId?: number,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const url = `${apiUrlOUCRCCheckAvailability}?project_id=${projectId}`;
    return useSnackQuery({
        queryKey: ['checkAvailabilityOrgUnitChangeRequestConfigs', url],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(projectId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            retry: false,
            select: data => {
                return (
                    data?.map((orgUnitType: OrgUnitType) => ({
                        value: orgUnitType.id,
                        label: orgUnitType.name,
                    })) ?? []
                );
            },
        },
    });
};

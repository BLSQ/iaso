import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { DropdownOptions } from '../../../../../types/utils';
import { apiUrlOUCRCCheckAvailability } from '../../constants';
import { OrgUnitType } from '../../types';

export const useGetOUCRCCheckAvailabilityDropdownOptions = (
    projectId?: number,
    type?: string,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const url = `${apiUrlOUCRCCheckAvailability}?project_id=${projectId}&type=${type}`;
    return useSnackQuery({
        queryKey: ['checkAvailabilityOrgUnitChangeRequestConfigs', url],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(projectId) && Boolean(type),
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

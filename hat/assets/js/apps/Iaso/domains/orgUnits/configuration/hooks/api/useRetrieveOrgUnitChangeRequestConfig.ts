import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { apiUrlOUCRC } from '../../constants';
import { OrgUnitChangeRequestConfigurationFull } from '../../types';

const retrieveOrgUnitChangeRequestConfig = (url: string) => {
    return getRequest(url) as Promise<OrgUnitChangeRequestConfigurationFull>;
};

export const useRetrieveOrgUnitChangeRequestConfig = (
    configId?: number,
): UseQueryResult<OrgUnitChangeRequestConfigurationFull, Error> => {
    const url = `${apiUrlOUCRC}${configId}`;
    return useSnackQuery({
        queryKey: ['useRetrieveOrgUnitChangeRequestConfig', url],
        queryFn: () => retrieveOrgUnitChangeRequestConfig(url),
        options: {
            enabled: Boolean(configId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};

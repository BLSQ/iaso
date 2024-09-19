import { UseQueryResult } from 'react-query';
import { makeUrlWithParams } from '../../../../../libs/utils';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

import { useLocale } from '../../../../app/contexts/LocaleContext';
import { apiUrl } from '../../constants';
import {
    CheckAvailiabilityOrgUnitRequestConfig,
    OrgUnitChangeRequestConfigsParams, OrgUnitType,
} from '../../types';
import { DropdownOptions } from '../../../../../types/utils';

const checkAvailabilityOrgUnitChangeRequestConfigs = (url: string) => {
    return getRequest(url) as Promise<CheckAvailiabilityOrgUnitRequestConfig>;
};

export const useCheckAvailabilityOrgUnitChangeRequestConfigs = (
    params: OrgUnitChangeRequestConfigsParams,
): UseQueryResult<DropdownOptions<number>, Error> => {
    const { locale } = useLocale();
    const apiParams = {
        project_id: params.project_id,
    };

    const url = makeUrlWithParams(`${apiUrl}check_availability/`, apiParams);
    return useSnackQuery({
        // Including locale in the query key because we need to make a call to update translations coming from the backend
        queryKey: ['checkAvailabilityOrgUnitChangeRequestConfigs', url, locale],
        queryFn: () => checkAvailabilityOrgUnitChangeRequestConfigs(url),
        options: {
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

import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../../libs/utils';

import { useLocale } from '../../../../app/contexts/LocaleContext';
import { apiUrlOUCRC } from '../../constants';
import {
    OrgUnitChangeRequestConfigsPaginated,
    OrgUnitChangeRequestConfigsParams,
} from '../../types';

const getOrgUnitChangeRequestConfigs = (url: string) => {
    return getRequest(url) as Promise<OrgUnitChangeRequestConfigsPaginated>;
};

export const useGetOrgUnitChangeRequestConfigs = (
    params: OrgUnitChangeRequestConfigsParams,
): UseQueryResult<OrgUnitChangeRequestConfigsPaginated, Error> => {
    const { locale } = useLocale();
    const apiParams = {
        org_unit_type_id: params.org_unit_type_id,
        project_id: params.project_id,
        type: params.type,
        order: params.order || '-updated_at',
        limit: params.pageSize || 10,
        page: params.page,
    };

    const url = makeUrlWithParams(apiUrlOUCRC, apiParams);
    return useSnackQuery({
        // Including locale in the query key because we need to make a call to update translations coming from the backend
        queryKey: ['getOrgUnitChangeRequestConfigs', url, locale],
        queryFn: () => getOrgUnitChangeRequestConfigs(url),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};

import { UseQueryResult } from 'react-query';
import { ValidationWorkflowInstanceListResponse } from 'Iaso/domains/validationWorkflowInstances/types';
import { WF_BASE_QUERYKEY } from 'Iaso/domains/validationWorkflowsConfiguration/constants';
import { FormattedApiParams, useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

type UseGetValidationWorkflowInstanceSearchProps = {
    params: Record<string, any>;
};
const defaults = {
    order: 'last_updated',
    pageSize: 20,
    page: 1,
};

const getValidationWorkflowInstances = async (
    params: FormattedApiParams,
): Promise<ValidationWorkflowInstanceListResponse> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/validation-workflows/instance/?${queryString}`);
};

export const useGetValidationWorkflowInstanceSearch = ({
    params,
}: UseGetValidationWorkflowInstanceSearchProps): UseQueryResult<ValidationWorkflowInstanceListResponse> => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);

    return useSnackQuery({
        queryKey: [WF_BASE_QUERYKEY, params],
        queryFn: () => getValidationWorkflowInstances(apiParams),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
            retry: false,
        },
    });
};

import React from 'react';
import { UseQueryResult } from 'react-query';
import { ValidationWorkflowInstanceListResponse } from 'Iaso/domains/validationWorkflowInstances/types';
import { WF_BASE_QUERYKEY } from 'Iaso/domains/validationWorkflowsConfiguration/constants';
import { FormattedApiParams, useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { createSearchParamsWithArray } from 'Iaso/libs/utils';

type UseGetValidationWorkflowInstanceSearchProps = {
    params: Record<string, any>;
};
const defaults = {
    order: 'last_updated',
    pageSize: 20,
    page: 1,
};

const useGetValidationWorkflowInstanceSearchParams = (
    params: FormattedApiParams,
): FormattedApiParams => {
    return React.useMemo(() => {
        if (params?.forms) {
            params.forms = Array.isArray(params?.forms)
                ? params?.forms
                : (params?.forms?.split(',') ?? []);
        }
        if (params?.validation_workflows) {
            params.validation_workflows = Array.isArray(
                params?.validation_workflows,
            )
                ? params?.validation_workflows
                : (params?.validation_workflows?.split(',') ?? []);
        }
        return params;
    }, [params]);
};
const getValidationWorkflowInstances = async (
    params: FormattedApiParams,
): Promise<ValidationWorkflowInstanceListResponse> => {
    const queryString = createSearchParamsWithArray(params).toString();
    return getRequest(`/api/validation-workflows/instance/?${queryString}`);
};

export const useGetValidationWorkflowInstanceSearch = ({
    params,
}: UseGetValidationWorkflowInstanceSearchProps): UseQueryResult<ValidationWorkflowInstanceListResponse> => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    const cleanedParams =
        useGetValidationWorkflowInstanceSearchParams(apiParams);

    return useSnackQuery({
        queryKey: [WF_BASE_QUERYKEY, params],
        queryFn: () => getValidationWorkflowInstances(cleanedParams),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
            retry: false,
        },
    });
};

import React from 'react';
import { UseQueryResult } from 'react-query';
import {
    DEFAULT_ORDER,
    DEFAULT_PAGE_SIZE,
    INSTANCES_API_URL,
    INSTANCES_QUERYKEY,
} from 'Iaso/domains/validationWorkflowInstances/constants';
import {
    ValidationWorkflowInstanceCounts,
    ValidationWorkflowInstanceListResponse,
} from 'Iaso/domains/validationWorkflowInstances/types';
import { FormattedApiParams, useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { createSearchParamsWithArray } from 'Iaso/libs/utils';

export type UseGetValidationWorkflowInstanceSearchProps = {
    params: Record<string, any>;
};
const defaults = {
    order: DEFAULT_ORDER,
    pageSize: DEFAULT_PAGE_SIZE,
    page: 1,
};

// A validation queue changes each time somebody validates: always refetch when the page is opened
const queryOptions = {
    keepPreviousData: true,
    retry: false,
};

const useGetValidationWorkflowInstanceSearchParams = (
    params: FormattedApiParams,
): FormattedApiParams => {
    return React.useMemo(() => {
        const formattedParams = { ...params };
        if (formattedParams.forms) {
            formattedParams.forms = Array.isArray(formattedParams.forms)
                ? formattedParams.forms
                : (formattedParams.forms.split(',') ?? []);
        }
        if (formattedParams.validation_workflows) {
            formattedParams.validation_workflows = Array.isArray(
                formattedParams.validation_workflows,
            )
                ? formattedParams.validation_workflows
                : (formattedParams.validation_workflows.split(',') ?? []);
        }
        if (formattedParams.org_unit) {
            formattedParams.org_units = Array.isArray(formattedParams.org_unit)
                ? formattedParams.org_unit.join(',')
                : formattedParams.org_unit;
            delete formattedParams.org_unit;
        }
        return formattedParams;
    }, [params]);
};

const useCleanedParams = (params: Record<string, any>): FormattedApiParams => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    return useGetValidationWorkflowInstanceSearchParams(apiParams);
};

const getValidationWorkflowInstances = async (
    params: FormattedApiParams,
): Promise<ValidationWorkflowInstanceListResponse> => {
    const queryString = createSearchParamsWithArray(params).toString();
    return getRequest(`${INSTANCES_API_URL}?${queryString}`);
};

export const useGetValidationWorkflowInstanceSearch = ({
    params,
}: UseGetValidationWorkflowInstanceSearchProps): UseQueryResult<ValidationWorkflowInstanceListResponse> => {
    const cleanedParams = useCleanedParams(params);

    return useSnackQuery({
        queryKey: [INSTANCES_QUERYKEY, 'list', cleanedParams],
        queryFn: () => getValidationWorkflowInstances(cleanedParams),
        options: queryOptions,
    });
};

const getValidationWorkflowInstanceCounts = async (
    params: FormattedApiParams,
): Promise<ValidationWorkflowInstanceCounts> => {
    const queryString = createSearchParamsWithArray(params).toString();
    return getRequest(`${INSTANCES_API_URL}counts/?${queryString}`);
};

export const useGetValidationWorkflowInstanceCounts = ({
    params,
}: UseGetValidationWorkflowInstanceSearchProps): UseQueryResult<ValidationWorkflowInstanceCounts> => {
    const cleanedParams = useCleanedParams(params);
    const countsParams = React.useMemo(() => {
        // the counts don't depend on the pagination nor the order
        const {
            page: _page,
            limit: _limit,
            order: _order,
            ...filters
        } = cleanedParams;
        return filters as FormattedApiParams;
    }, [cleanedParams]);

    return useSnackQuery({
        queryKey: [INSTANCES_QUERYKEY, 'counts', countsParams],
        queryFn: () => getValidationWorkflowInstanceCounts(countsParams),
        options: queryOptions,
    });
};

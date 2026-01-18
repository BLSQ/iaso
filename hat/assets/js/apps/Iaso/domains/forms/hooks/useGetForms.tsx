import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../hooks/useApiParams';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { Form } from '../types/forms';
import { FormsParams } from '../types/forms';

export const DEFAULT_VISIBLE_COLUMNS = [
    'projects',
    'name',
    'created_at',
    'updated_at',
    'org_unit_types',
];
const FIELDS_PARAMS = [
    'id',
    'form_id',
    'device_field',
    'location_field',
    'org_unit_type_ids',
    'project_ids',
    'period_type',
    'single_per_period',
    'periods_before_allowed',
    'periods_after_allowed',
    'latest_form_version',
    'updated_at',
    'deleted_at',
    'derived',
    'label_keys',
    'possible_fields',
    'legend_threshold',
    'has_mappings',
];

const getForms = (params: FormsParams) => {
    const fields = `${
        params.fields ? params.fields : DEFAULT_VISIBLE_COLUMNS.join(',')
    },${FIELDS_PARAMS}`;
    const queryString = new URLSearchParams({
        ...params,
        fields,
    }).toString();
    return getRequest(`/api/forms/?${queryString}`);
};

export const tableDefaults = {
    order: 'instance_updated_at',
    limit: 50,
    page: 1,
};

export type FormResponse = {
    limit: number;
    count: number;
    forms: Form[];
    has_previous: boolean;
    has_next: boolean;
    page: number;
    pages: number;
};
export const useGetForms = (
    params: FormsParams,
    defaults = tableDefaults,
    enabled = false,
): UseQueryResult<FormResponse, Error> => {
    const safeParams = useApiParams(params, defaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    if (safeParams?.fields) {
        delete safeParams.fields;
    }
    const fields = useMemo(
        () =>
            params?.fields
                ?.split(',')
                .filter(p => p !== 'actions')
                .sort()
                .join(','),
        [params?.fields],
    );
    return useSnackQuery({
        queryKey: ['forms', safeParams, fields],
        queryFn: () =>
            getForms({ ...safeParams, fields } as unknown as FormsParams),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
            enabled,
        },
    });
};

import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../hooks/useApiParams';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { Form } from '../types/forms';

const FIELDS_PARAMS = [
    'id',
    'name',
    'form_id',
    'device_field',
    'location_field',
    'org_unit_types',
    'org_unit_type_ids',
    'projects',
    'project_ids',
    'period_type',
    'single_per_period',
    'periods_before_allowed',
    'periods_after_allowed',
    'latest_form_version',
    'instance_updated_at',
    'created_at',
    'updated_at',
    'deleted_at',
    'derived',
    'label_keys',
    'possible_fields',
    'legend_threshold',
    'has_mappings',
];

const getForms = params => {
    const fields =
        params.showInstancesCount === 'true'
            ? `${FIELDS_PARAMS.join(',')},instances_count`
            : FIELDS_PARAMS.join(',');

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

type FormResponse = {
    limit: number;
    count: number;
    forms: Form[];
    has_previous: boolean;
    has_next: boolean;
    page: number;
    pages: number;
};
export const useGetForms = (
    params,
    defaults = tableDefaults,
    enabled = false,
): UseQueryResult<FormResponse, Error> => {
    const safeParams = useApiParams(params, defaults);
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['forms', safeParams],
        queryFn: () => getForms({ ...safeParams }),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
            enabled,
        },
    });
};

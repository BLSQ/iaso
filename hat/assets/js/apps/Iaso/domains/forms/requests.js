import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { getRequest } from 'Iaso/libs/Api.ts';

export const useGetForm = formId =>
    useSnackQuery(
        ['forms', formId],
        () =>
            getRequest(
                // eslint-disable-next-line max-len
                `/api/forms/${formId}/?fields=id,name,org_unit_types,projects,period_type,derived,single_per_period,periods_before_allowed,periods_after_allowed,device_field,location_field,label_keys,possible_fields,legend_threshold,change_request_mode`,
            ),
        undefined,
        {
            enabled: formId && formId !== '0',
            keepPreviousData: true,
        },
    );

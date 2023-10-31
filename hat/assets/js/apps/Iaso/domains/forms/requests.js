import { useQueryClient } from 'react-query';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';

export const useGetForm = formId =>
    useSnackQuery(
        ['forms', formId],
        () =>
            getRequest(
                // eslint-disable-next-line max-len
                `/api/forms/${formId}/?fields=id,name,org_unit_types,projects,period_type,derived,single_per_period,periods_before_allowed,periods_after_allowed,device_field,location_field,label_keys,possible_fields`,
            ),
        undefined,
        {
            enabled: formId && formId !== '0',
        },
    );

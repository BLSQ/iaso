import { iasoGetRequest } from '../../utils/requests';

export const fetchFormDetails = formId => {
    return iasoGetRequest({
        requestParams: {
            // eslint-disable-next-line max-len
            url: `/api/forms/${formId}/?fields=id,name,org_unit_types,projects,period_type,derived,single_per_period,periods_before_allowed,periods_after_allowed,device_field,location_field,label_keys,possible_fields`,
        },
        disableSuccessSnackBar: true,
        errorKeyMessage: 'Fetch form details',
        consoleError: 'fetchFormDetails',
    }).then(response => {
        return response;
    });
};

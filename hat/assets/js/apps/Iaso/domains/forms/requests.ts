import { openSnackBar } from '../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../constants/snackBars';
import {
    getRequest,
    patchRequest,
    postRequest,
    putRequest,
} from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';

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

export const createForm = formData =>
    postRequest('/api/forms/', formData).catch(error => {
        openSnackBar(errorSnackBar('createFormError', null, error));
    });

export const updateForm = (formId, formData) =>
    putRequest(`/api/forms/${formId}/`, formData).catch(error => {
        openSnackBar(errorSnackBar('updateFormError', null, error));
    });

export const createFormVersion = formVersionData => {
    const { data } = formVersionData;
    const fileData = { xls_file: formVersionData.xls_file };

    return postRequest('/api/formversions/', data, fileData).catch(error => {
        console.error(
            'Error details:',
            error.details,
            'Error message:',
            error.message,
            'Error body:',
            error.body,
        );
        openSnackBar(errorSnackBar('createFormVersionError', null, error));
        throw error;
    });
};

export const updateFormVersion = data => {
    return patchRequest(`/api/formversions/${data.id}/`, data).catch(error => {
        openSnackBar(errorSnackBar('updateFormVersionError', null, error));
        throw error;
    });
};

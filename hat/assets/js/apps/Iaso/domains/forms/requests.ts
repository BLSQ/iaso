import { UseQueryResult } from 'react-query';
import { openSnackBar } from '../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../constants/snackBars';
import {
    getRequest,
    patchRequest,
    postRequest,
    putRequest,
} from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';
import { Form } from './types/forms';

export const useGetForm = (
    formId: number | string | undefined,
    enabled = Boolean(formId) && formId !== '0',
    fields?: string | undefined,
    appId?: string,
): UseQueryResult<Form, Error> => {
    const queryKey: any[] = ['forms', formId];
    if (fields) {
        queryKey.push(fields);
    }
    let url = `/api/forms/${formId}`;
    if (fields) {
        url += `/?fields=${fields}`;
        if (appId) {
            url += `&app_id=${appId}`;
        }
    } else if (appId) {
        url += `/?app_id=${appId}`;
    }
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            enabled,
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
        },
    });
};

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

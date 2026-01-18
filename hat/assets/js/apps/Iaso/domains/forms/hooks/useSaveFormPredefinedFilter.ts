import { UseMutationResult } from 'react-query';
import { FormPredefinedFilter } from 'Iaso/domains/forms/types/forms';
import { patchRequest, postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

const saveFormPredefinedFilter = (filter: FormPredefinedFilter) => {
    if (filter.id === 0) {
        return postRequest({
            url: '/api/formpredefinedfilters/',
            data: {
                name: filter.name,
                form_id: filter.form_id,
                short_name: filter.short_name,
                json_logic: filter.json_logic,
            },
        });
    }
    return patchRequest(`/api/formpredefinedfilters/${filter.id}/`, {
        name: filter.name,
        short_name: filter.short_name,
        json_logic: filter.json_logic,
    });
};

export const useSaveFormPredefinedFilter = (): UseMutationResult => {
    return useSnackMutation<any, any, any, any>({
        mutationFn: (filter: FormPredefinedFilter) =>
            saveFormPredefinedFilter(filter),
        invalidateQueryKey: 'formPredefinedFilters',
        snackErrorMsg: MESSAGES.uploadError,
        snackSuccessMessage: MESSAGES.uploadSuccess,
    });
};

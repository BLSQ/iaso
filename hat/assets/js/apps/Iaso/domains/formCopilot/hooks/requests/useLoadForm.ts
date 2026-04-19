import { getRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { LoadFormResponse } from '../../types';

export const useLoadForm = () => {
    return useSnackMutation<LoadFormResponse, Error, number>({
        mutationFn: (formId: number) =>
            getRequest(`/api/form_copilot/load/${formId}/`),
        showSuccessSnackBar: false,
    });
};

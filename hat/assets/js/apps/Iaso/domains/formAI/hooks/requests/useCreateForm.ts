import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { CreateFormPayload, CreateFormResponse } from '../../types';

export const useCreateForm = () => {
    return useSnackMutation<CreateFormResponse, Error, CreateFormPayload>({
        mutationFn: (data: CreateFormPayload) =>
            postRequest('/api/forms/', data),
        showSuccessSnackBar: false,
    });
};

import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { FormAIRequest, FormAIResponse } from '../../types';

export const useSendMessage = () => {
    return useSnackMutation<FormAIResponse, Error, FormAIRequest>({
        mutationFn: (data: FormAIRequest) => postRequest('/api/form_ai/', data),
        showSuccessSnackBar: false,
    });
};

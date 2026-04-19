import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { FormCopilotRequest, FormCopilotResponse } from '../../types';

export const useSendMessage = () => {
    return useSnackMutation<FormCopilotResponse, Error, FormCopilotRequest>({
        mutationFn: (data: FormCopilotRequest) =>
            postRequest('/api/form_copilot/', data),
        showSuccessSnackBar: false,
    });
};

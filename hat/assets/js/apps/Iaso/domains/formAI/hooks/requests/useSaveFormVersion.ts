import { postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import MESSAGES from '../../messages';
import { SaveVersionResponse } from '../../types';

type SaveVersionPayload = {
    formId: number;
    xlsformUuid: string;
    formOdkId?: string;
};

export const useSaveFormVersion = () => {
    return useSnackMutation<SaveVersionResponse, Error, SaveVersionPayload>({
        mutationFn: ({ formId, xlsformUuid, formOdkId }: SaveVersionPayload) =>
            postRequest('/api/form_ai/save/', {
                form_id: formId,
                xlsform_uuid: xlsformUuid,
                ...(formOdkId ? { form_odk_id: formOdkId } : {}),
            }),
        snackSuccessMessage: MESSAGES.versionSaved,
        invalidateQueryKey: ['formAIFormsList'],
    });
};

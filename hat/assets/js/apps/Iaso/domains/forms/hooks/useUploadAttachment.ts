import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

const uploadAttachment = (files: File[], formId: string) => {
    const fileData = { file: files[0] };
    return postRequest({
        url: '/api/formattachments/',
        fileData,
        data: {
            form_id: formId,
        },
    });
};

export const useUploadAttachment = (formId: string): UseMutationResult => {
    return useSnackMutation<any, any, any, any>({
        mutationFn: file => uploadAttachment(file, formId),
        invalidateQueryKey: 'formAttachments',
        snackErrorMsg: MESSAGES.uploadError,
        snackSuccessMessage: MESSAGES.uploadSuccess,
    });
};

import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import MESSAGES from '../../../messages';
import { BulkImportPayload } from '../../../types';

const uploadCsv = (values: BulkImportPayload) => {
    const { file, ...defaultValues } = values;

    // Only send default values if they have actual values
    const cleanDefaults = Object.entries(defaultValues).reduce(
        (acc, [key, value]) => {
            if (value && (Array.isArray(value) ? value.length > 0 : true)) {
                acc[key] = value;
            }
            return acc;
        },
        {} as Record<string, any>,
    );

    return postRequest({
        url: '/api/bulkcreateuser/',
        fileData: { file },
        data: cleanDefaults,
    });
};

export const useUploadCsv = (): UseMutationResult => {
    return useSnackMutation<any, any, any, any>({
        mutationFn: (payload: BulkImportPayload) => uploadCsv(payload),
        invalidateQueryKey: 'profiles',
        snackErrorMsg: MESSAGES.uploadError,
        snackSuccessMessage: MESSAGES.uploadSuccess,
    });
};

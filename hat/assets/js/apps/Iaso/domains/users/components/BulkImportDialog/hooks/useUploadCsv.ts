import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import MESSAGES from '../../../messages';

type Values = {
    file: File[];
};

const uploadCsv = (values: Values) => {
    return postRequest({
        url: '/api/bulkcreateuser/',
        fileData: { file: values.file },
        data: values,
    });
};

// TODO add messages
export const useUploadCsv = (): UseMutationResult => {
    return useSnackMutation<any, any, any, any>({
        mutationFn: file => uploadCsv(file),
        invalidateQueryKey: 'profiles',
        snackErrorMsg: MESSAGES.uploadError,
        snackSuccessMessage: MESSAGES.uploadSuccess,
    });
};

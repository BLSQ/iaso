import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

type Values = {
    file: File[];
};
const uploadCsv = (values: Values) => {
    return postRequest({
        url: '/api/polio/linelistimport/',
        fileData: { file: values.file },
        data: values,
    });
};

// TODO add messages
export const useUploadLine = (): UseMutationResult => {
    return useSnackMutation<any, any, any, any>({
        mutationFn: file => uploadCsv(file),
        invalidateQueryKey: 'profiles',
        showSucessSnackBar: false,
    });
};

import { UseMutationResult } from 'react-query';

import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

export type ExportPayload = {
    userId: number;
    projectId: number;
    password: string;
};

export const useCreateExportMobileSetup = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (data: ExportPayload) => {
            const { userId, projectId, password } = data;

            return postRequest('/api/tasks/create/exportmobilesetup/', {
                user_id: userId,
                project_id: projectId,
                password: password,
            });
        },
        showSucessSnackBar: false,
    });
};

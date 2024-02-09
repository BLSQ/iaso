import { UseMutationResult } from 'react-query';

import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

export type ExportPayload = {
    userId: number;
    projectId: number;
};

export const useCreateExportMobileSetup = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (data: ExportPayload) => {
            const { userId, projectId } = data;

            return postRequest('/api/tasks/create/exportmobilesetup/', {
                user_id: userId,
                project_id: projectId,
            });
        },
        showSucessSnackBar: false,
    });
};

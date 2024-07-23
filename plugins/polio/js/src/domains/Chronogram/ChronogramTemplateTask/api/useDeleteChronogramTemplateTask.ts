import { UseMutationResult } from 'react-query';

import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { deleteRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { apiBaseUrl } from '../../constants';

const deleteChronogramTemplateTask = (chronogramTemplateTaskId: number) => {
    return deleteRequest(
        `${apiBaseUrl}/template_tasks/${chronogramTemplateTaskId}/`,
    );
};

export const useDeleteChronogramTemplateTask = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteChronogramTemplateTask,
        invalidateQueryKey: 'chronogramTemplateTaskList',
    });

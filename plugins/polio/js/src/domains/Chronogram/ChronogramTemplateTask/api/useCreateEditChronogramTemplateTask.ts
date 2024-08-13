import { UseMutationResult, useQueryClient } from 'react-query';

import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    patchRequest,
    postRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { apiBaseUrl } from '../../constants';

import { ChronogramTemplateTask } from '../types';

const createEditChronogramTemplateTask = (body: ChronogramTemplateTask) => {
    if (body.id) {
        return patchRequest(`${apiBaseUrl}/template_tasks/${body.id}/`, body);
    }
    return postRequest(`${apiBaseUrl}/template_tasks/`, body);
};

export const useCreateEditChronogramTemplateTask = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body => createEditChronogramTemplateTask(body),
        options: {
            onSuccess: () => {
                queryClient.invalidateQueries('chronogramTemplateTaskList');
            },
        },
    });
};

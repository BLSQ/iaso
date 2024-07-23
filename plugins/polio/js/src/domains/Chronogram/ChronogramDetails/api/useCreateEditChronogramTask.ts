import { UseMutationResult, useQueryClient } from 'react-query';

import {
    patchRequest,
    postRequest,
} from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { ChronogramTask } from '../../Chronogram/types';
import { apiBaseUrl } from '../../constants';

const createEditChronogramTask = (body: ChronogramTask) => {
    if (body.id) {
        return patchRequest(`${apiBaseUrl}/tasks/${body.id}/`, body);
    }
    return postRequest(`${apiBaseUrl}/tasks/`, body);
};

export const useCreateEditChronogramTask = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body => createEditChronogramTask(body),
        options: {
            onSuccess: () => {
                queryClient.invalidateQueries('chronogramTasksList');
            },
        },
    });
};

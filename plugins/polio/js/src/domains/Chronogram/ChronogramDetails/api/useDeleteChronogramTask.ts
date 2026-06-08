import { UseMutationResult } from 'react-query';

import { deleteRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { apiBaseUrl } from '../../constants';

const deleteChronogramTask = (chronogramTaskId: number) => {
    return deleteRequest(`${apiBaseUrl}/tasks/${chronogramTaskId}/`);
};

export const useDeleteChronogramTask = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteChronogramTask,
        invalidateQueryKey: 'chronogramTasksList',
    });

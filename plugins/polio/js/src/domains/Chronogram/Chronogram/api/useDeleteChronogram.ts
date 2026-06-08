import { UseMutationResult } from 'react-query';

import { deleteRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { apiBaseUrl } from '../../constants';

const deleteChronogram = (chronogramId: number) => {
    return deleteRequest(`${apiBaseUrl}/${chronogramId}/`);
};

export const useDeleteChronogram = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteChronogram,
        invalidateQueryKey: 'chronogramList',
    });

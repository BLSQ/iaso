import { UseMutationResult } from 'react-query';

import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { deleteRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { apiBaseUrl } from '../../constants';

const deleteChronogram = (chronogramId: number) => {
    return deleteRequest(`${apiBaseUrl}/${chronogramId}/`);
};

export const useDeleteChronogram = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: deleteChronogram,
        invalidateQueryKey: 'chronogramList',
    });

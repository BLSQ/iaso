import { UseMutationResult } from 'react-query';

import { postRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { apiBaseUrl } from '../../constants';
import MESSAGES from '../messages';

export const useCreateChronogram = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: body =>
            postRequest(`${apiBaseUrl}/`, {
                round: body.round,
            }),
        snackSuccessMessage: MESSAGES.messageCreateSuccess,
        invalidateQueryKey: 'chronogramList',
    });
};

import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../libs/apiHooks';
import { deleteRequest } from '../../../libs/Api';

import MESSAGES from '../messages';

export const useDeleteStockMovement = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/stock/movements/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['stockMovements'],
    );

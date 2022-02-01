import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../libs/apiHooks';
import { deleteRequest } from '../../../libs/Api';
import MESSAGES from '../messages';

export const useDelete = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/entity/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['entities'],
    );

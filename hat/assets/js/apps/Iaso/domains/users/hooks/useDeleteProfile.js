import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { deleteRequest } from 'Iaso/libs/Api.ts';
import MESSAGES from '../messages.ts';

export const useDeleteProfile = () =>
    useSnackMutation(
        body => deleteRequest(`/api/profiles/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['profiles', 'usersHistoryList'],
    );

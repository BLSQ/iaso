import { deleteRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import MESSAGES from '../messages';

export const useDeleteProfile = (userId: string | number | undefined) =>
    useSnackMutation(
        body => deleteRequest(`/api/v2/profiles/${userId ?? body?.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['profiles', 'usersHistoryList'],
    );

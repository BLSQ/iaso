import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { deleteRequest } from 'Iaso/libs/Api';
import MESSAGES from '../messages';

export const useDeleteProfile = () =>
    useSnackMutation(
        body => deleteRequest(`/api/profiles/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['profiles'],
    );

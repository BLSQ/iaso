import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { deleteRequest } from 'Iaso/libs/Api';
import MESSAGES from '../messages';

export const useDelete = () =>
    useSnackMutation(
        body => deleteRequest(`/api/entity/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['entities'],
    );

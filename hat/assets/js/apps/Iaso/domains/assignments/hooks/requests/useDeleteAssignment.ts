import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { deleteRequest } from '../../../../libs/Api';

export const useDeleteAssignment = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/microplanning/assignments/${body.id}/`),
        undefined,
        undefined,
        ['assignmentsList'],
        {},
        true,
    );

import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

export const useDeleteAssignment = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body =>
            deleteRequest(`/api/microplanning/assignments/${body.id}/`),
        invalidateQueryKey: ['assignmentsList'],
    });

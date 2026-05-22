import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { ASSIGNMENTS_API_URL } from '../../constants/api';

export const useDeleteAssignment = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => deleteRequest(`${ASSIGNMENTS_API_URL}${body.id}/`),
        invalidateQueryKey: ['assignmentsList'],
    });

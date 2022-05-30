import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { endpoint } from '../../constants';

const deletePlanning = (id: number) => deleteRequest(`${endpoint}${id}`);

export const useDeletePlanning = (): UseMutationResult => {
    return useSnackMutation(deletePlanning, undefined, undefined, [
        'planningsList',
    ]);
};

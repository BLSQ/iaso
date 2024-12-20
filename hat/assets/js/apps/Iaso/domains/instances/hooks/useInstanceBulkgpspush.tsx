import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

type BulkGpsPush = {
    select_all: boolean;
    selected_ids: string[];
    unselected_ids: string[];
};
export const useInstanceBulkgpspush = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (data: BulkGpsPush) => {
            const { select_all, selected_ids, unselected_ids } = data;

            return postRequest('/api/tasks/create/instancebulkgpspush/', {
                select_all,
                selected_ids,
                unselected_ids,
            });
        },
        showSucessSnackBar: false,
    });
};

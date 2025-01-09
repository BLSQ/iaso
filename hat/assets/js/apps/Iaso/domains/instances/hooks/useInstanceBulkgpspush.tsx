import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

type BulkGpsPushParams = {
    select_all: boolean;
    selected_ids: string[];
    unselected_ids: string[];
};
export const useInstanceBulkgpspush = (): UseMutationResult => {
    return useSnackMutation(
        ({ select_all, selected_ids, unselected_ids }: BulkGpsPushParams) => {
            return postRequest('/api/tasks/create/instancebulkgpspush/', {
                select_all,
                selected_ids,
                unselected_ids,
            });
        },
        MESSAGES.pushGpsTaskPlanned,
        MESSAGES.pushGpsTaskError,
    );
};

import { UseMutationResult } from 'react-query';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

type BulkGpsPushParams = {
    select_all: boolean;
    selected_ids: string[];
    unselected_ids: string[];
    filters: Record<string, string>;
};
export const useInstanceBulkgpspush = (): UseMutationResult => {
    return useSnackMutation(
        ({ select_all, selected_ids, unselected_ids, filters }: BulkGpsPushParams) => {
            const url = makeUrlWithParams('/api/tasks/create/instancebulkgpspush/', filters);
            return postRequest(url, {
                select_all,
                selected_ids,
                unselected_ids,
            });
        },
        MESSAGES.pushGpsTaskPlanned,
        MESSAGES.pushGpsTaskError,
    );
};

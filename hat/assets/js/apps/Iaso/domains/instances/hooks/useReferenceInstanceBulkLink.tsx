import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

type BulkInstanceReferenceLinkParams = {
    actions: string[];
    select_all: boolean;
    selected_ids: string[];
    unselected_ids: string[];
};
export const useReferenceInstanceBulkLink = (): UseMutationResult => {
    return useSnackMutation(
        ({
            actions,
            select_all,
            selected_ids,
            unselected_ids,
        }: BulkInstanceReferenceLinkParams) => {
            return postRequest('/api/tasks/create/instanceReferencebulkLink/', {
                actions,
                select_all,
                selected_ids,
                unselected_ids,
            });
        },
        MESSAGES.pushGpsTaskPlanned,
        MESSAGES.pushGpsTaskError,
        'instances',
    );
};

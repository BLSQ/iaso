import { UseMutationResult } from 'react-query';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

type BulkInstanceReferenceLinkParams = {
    actions: string[];
    select_all: boolean;
    selected_ids: string[];
    unselected_ids: string[];
    filters: Record<string, string>;
};
export const useReferenceInstanceBulkLink = (): UseMutationResult => {
    return useSnackMutation(
        ({
            actions,
            select_all,
            selected_ids,
            unselected_ids,
            filters,
        }: BulkInstanceReferenceLinkParams) => {
            const url = makeUrlWithParams('/api/tasks/create/instancereferencebulklink/', filters);
            return postRequest(url, {
                actions,
                select_all,
                selected_ids,
                unselected_ids,
            });
        },
        MESSAGES.referenceInstanceLinkTaskPlanned,
        MESSAGES.referenceInstanceLinkTaskError,
        'instances',
    );
};

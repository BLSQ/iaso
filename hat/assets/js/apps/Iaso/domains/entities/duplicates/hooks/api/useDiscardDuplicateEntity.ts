import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import ENTITY_MESSAGES from '../../../messages';

const apiUrl = '/api/entityduplicates/';

export type DiscardDuplicateEntityParams = {
    entity1_id: number;
    entity2_id: number;
    entity_to_discard_id: number;
};

/**
 * Resolve a duplicate pair by soft deleting one of its entities, with its submissions.
 * For accounts with the ENTITY_DUPLICATES_SOFT_DELETE feature flag.
 */
export const useDiscardDuplicateEntity = (
    onSuccess: (data: any) => void = _data => null,
): UseMutationResult<unknown, unknown, DiscardDuplicateEntityParams> =>
    useSnackMutation({
        mutationFn: (query: DiscardDuplicateEntityParams) =>
            postRequest({
                url: apiUrl,
                data: { ...query, action: 'discard_entity' },
            }),
        snackSuccessMessage: ENTITY_MESSAGES.deleteSuccess,
        snackErrorMsg: ENTITY_MESSAGES.deleteError,
        invalidateQueryKey: [
            ['entityDuplicates'],
            ['entities'],
            ['entities-count'],
            ['entity'],
        ],
        options: { onSuccess },
    });

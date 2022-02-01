import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { postRequest, patchRequest } from '../../../../libs/Api';

export const useSave = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entitytype/${body.id}/`, body)
                : postRequest('/api/entitytypes/', body),
        undefined,
        undefined,
        ['entitytypes'],
    );

import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { ApplyUpdateVariables, MappingVersionRow } from '../../types';

export const useApplyUpdate = (): UseMutationResult<
    MappingVersionRow,
    unknown,
    ApplyUpdateVariables
> =>
    useSnackMutation({
        mutationFn: ({ mappingVersionId, payload }) =>
            patchRequest(`/api/mappingversions/${mappingVersionId}/`, payload),
        invalidateQueryKey: ['mappingversions'],
    });

import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { ApplyPartialUpdateVariables, MappingVersionRow } from '../../types';

export const useApplyPartialUpdate = (): UseMutationResult<
    MappingVersionRow,
    unknown,
    ApplyPartialUpdateVariables
> =>
    useSnackMutation({
        mutationFn: ({ mappingVersionId, questionName, mapping }) =>
            patchRequest(`/api/mappingversions/${mappingVersionId}/`, {
                question_mappings: {
                    [questionName]: mapping,
                },
            }),
        invalidateQueryKey: ['mappingversions'],
    });

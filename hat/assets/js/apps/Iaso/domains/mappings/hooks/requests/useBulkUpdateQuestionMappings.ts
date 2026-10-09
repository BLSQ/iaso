import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { BulkUpdateVariables, MappingVersionRow } from '../../types';

export const useBulkUpdateQuestionMappings = (): UseMutationResult<
    MappingVersionRow,
    unknown,
    BulkUpdateVariables
> =>
    useSnackMutation({
        mutationFn: ({ mappingVersionId, questionMappings }) =>
            patchRequest(`/api/mappingversions/${mappingVersionId}/`, {
                question_mappings: questionMappings,
            }),
        invalidateQueryKey: ['mappingversions'],
        showSuccessSnackBar: false,
    });

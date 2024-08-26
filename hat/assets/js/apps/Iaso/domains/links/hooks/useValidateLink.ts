import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

const validateLink = link => {
    const newLink = {
        ...link,
        validated: !link.validated,
    };
    return patchRequest(`/api/links/${newLink.id}/`, newLink);
};

export const useValidateLink = (): UseMutationResult<any, any, any, any> => {
    return useSnackMutation({
        mutationFn: validateLink,
        invalidateQueryKey: 'links',
    });
};

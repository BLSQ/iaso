import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

const validateLink = link => {
    const newLink = {
        ...link,
        validated: !link.validated,
    };
    return patchRequest(`/api/links/${newLink.id}/`, newLink);
};

export const useValidateLink = () => {
    return useSnackMutation({
        mutationFn: validateLink,
        invalidateQueryKey: 'links',
    });
};

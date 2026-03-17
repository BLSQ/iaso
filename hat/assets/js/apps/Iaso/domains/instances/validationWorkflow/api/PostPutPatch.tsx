import { UseMutationResult } from 'react-query';
import { patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL } from '../constants';

const patchWorkflow = async body => {
    await 500;
    const { slug, ...payload } = body;
    console.log('slug', slug);
    console.log('payload', payload);
    // return patchRequest(`${API_URL}${slug}/`, payload);
};

export const useUpdateWorkflow = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: patchWorkflow,
        invalidateQueryKey: ['submissions-workflows'],
    });
};

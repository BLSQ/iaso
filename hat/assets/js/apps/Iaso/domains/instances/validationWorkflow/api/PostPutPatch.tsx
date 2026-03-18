import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { waitFor } from 'Iaso/utils';
import { API_URL } from '../constants';

const patchWorkflow = async body => {
    await waitFor(500);
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

const saveNode = async body => {
    await waitFor(500);
    const { workflowSlug, slug, ...payload } = body;
    if (body.slug) {
        console.log(
            'PUT',
            `${API_URL}${workflowSlug}/node-templates/${slug}`,
            payload,
        );
        // return putRequest(
        //     `${API_URL}${workflowSlug}/node-templates/${slug}`,
        //     payload,
        // );
    }
    console.log('POST', `${API_URL}${workflowSlug}/node-templates/`, payload);
    // return postRequest(`${API_URL}${workflowSlug}/node-templates/`, payload);
};

export const useSaveNode = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: ['submissions-workflows'],
    });
};

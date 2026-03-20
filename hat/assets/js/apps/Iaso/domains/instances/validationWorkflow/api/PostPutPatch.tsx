import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { waitFor } from 'Iaso/utils';
import { API_URL } from '../constants';

const postWorkflow = async body => {
    await waitFor(500);

    console.log('payload', body);
    // return postRequest(`${API_URL}/`, payload);
};

const patchWorkflow = async body => {
    await waitFor(500);
    const { slug, ...payload } = body;
    console.log('slug', slug);
    console.log('payload', payload);
    // return patchRequest(`${API_URL}${slug}/`, payload);
};

const createEditWorkflow = async body => {
    if ('slug' in body) {
        return patchWorkflow(body);
    }
    return postWorkflow(body);
};

export const useSaveWorkflow = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: createEditWorkflow,
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

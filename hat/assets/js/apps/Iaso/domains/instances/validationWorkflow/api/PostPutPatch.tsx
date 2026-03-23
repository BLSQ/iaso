import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL } from '../constants';

const postWorkflow = async body => {
    return postRequest(`${API_URL}`, body);
};

const patchWorkflow = async body => {
    const { slug, ...payload } = body;
    return patchRequest(`${API_URL}${slug}/`, payload);
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
    const { workflowSlug, slug, ...payload } = body;
    if (body.slug) {
        return putRequest(
            `${API_URL}${workflowSlug}/node-templates/${slug}`,
            payload,
        );
    }
    return postRequest(`${API_URL}${workflowSlug}/node-templates/`, payload);
};

export const useSaveNode = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: ['submissions-workflows'],
    });
};

import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL, WF_BASE_QUERYKEY } from '../constants';

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
        invalidateQueryKey: [WF_BASE_QUERYKEY],
    });
};

const saveNode = async body => {
    const { workflowSlug, slug, ...payload } = body;
    if (body.slug) {
        return putRequest(
            `${API_URL}${workflowSlug}/node-templates/${slug}/`,
            payload,
        );
    }
    return postRequest(`${API_URL}${workflowSlug}/node-templates/`, payload);
};

export const useSaveNode = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: [WF_BASE_QUERYKEY],
    });
};

const saveNodeOrder = (slug: string) => (body: any[]) => {
    return putRequest(`${API_URL}${slug}/node-templates/bulk/`, body);
};

export const useSaveNodeOrder = (slug: string) => {
    return useSnackMutation({
        mutationFn: saveNodeOrder(slug),
        invalidateQueryKey: WF_BASE_QUERYKEY,
    });
};

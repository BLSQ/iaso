import { UseMutationResult } from 'react-query';
import {
    ValidationNodeTemplateBulkUpdateBody,
    ValidationNodeTemplateCreateBody,
    ValidationNodeTemplateUpdateBody,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodeTemplates';
import {
    ValidationWorkflowCreateBody,
    ValidationWorkflowPatchBody,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationWorkflows';
import { patchRequest, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL, WF_BASE_QUERYKEY } from '../constants';

const postWorkflow = async (body: ValidationWorkflowCreateBody) => {
    return postRequest(`${API_URL}`, body);
};

const patchWorkflow = async ({
    slug,
    body,
}: {
    slug: string;
    body: ValidationWorkflowPatchBody;
}) => {
    return patchRequest(`${API_URL}${slug}/`, body);
};

const createEditWorkflow = async ({
    slug,
    body,
}: {
    slug?: string;
    body: ValidationWorkflowPatchBody | ValidationWorkflowCreateBody;
}) => {
    if (!!slug) {
        return patchWorkflow({
            slug: slug,
            body: body as ValidationWorkflowPatchBody,
        });
    }
    return postWorkflow(body as ValidationWorkflowCreateBody);
};

export const useSaveWorkflow = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: createEditWorkflow,
        invalidateQueryKey: [WF_BASE_QUERYKEY],
    });
};

const saveNode = async ({
    workflowSlug,
    slug,
    body,
}: {
    workflowSlug: string;
    slug?: string;
    body: ValidationNodeTemplateCreateBody | ValidationNodeTemplateUpdateBody;
}) => {
    if (!!slug) {
        return putRequest(
            `${API_URL}${workflowSlug}/node-templates/${slug}/`,
            body as ValidationNodeTemplateUpdateBody,
        );
    }
    return postRequest(
        `${API_URL}${workflowSlug}/node-templates/`,
        body as ValidationNodeTemplateCreateBody,
    );
};

export const useSaveNode = (): UseMutationResult<any, any> => {
    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: [WF_BASE_QUERYKEY],
    });
};

const saveNodeOrder =
    (slug: string) => (body: ValidationNodeTemplateBulkUpdateBody) => {
        return putRequest(`${API_URL}${slug}/node-templates/bulk/`, body);
    };

export const useSaveNodeOrder = (slug: string) => {
    return useSnackMutation({
        mutationFn: saveNodeOrder(slug),
        invalidateQueryKey: WF_BASE_QUERYKEY,
    });
};

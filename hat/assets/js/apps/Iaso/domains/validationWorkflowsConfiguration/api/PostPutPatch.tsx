import React from 'react';
import { UseMutationResult } from 'react-query';
import {
    getApiValidationWorkflowsListQueryKey,
    getApiValidationWorkflowsRetrieveQueryKey,
} from 'Iaso/api/validationWorkflows';
import {
    ValidationNodeTemplateBulkUpdateBody,
    ValidationNodeTemplateCreateBody,
    ValidationNodeTemplateUpdateBody,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodeTemplates';
import { postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { API_URL, WF_BASE_QUERYKEY } from '../constants';

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

export const useSaveNode = (nodeSlug?: string): UseMutationResult<any, any> => {
    const queryKey = React.useMemo(() => {
        return [
            ...getApiValidationWorkflowsListQueryKey(),
            ...(nodeSlug
                ? getApiValidationWorkflowsRetrieveQueryKey(nodeSlug)
                : []),
        ] as string[];
    }, [nodeSlug]);

    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: [...queryKey, WF_BASE_QUERYKEY],
    });
};

const saveNodeOrder =
    (slug: string) => (body: ValidationNodeTemplateBulkUpdateBody) => {
        return putRequest(`${API_URL}${slug}/node-templates/bulk/`, body);
    };

export const useSaveNodeOrder = (
    slug: string,
    invalidateQueryKey?: string[],
) => {
    return useSnackMutation({
        mutationFn: saveNodeOrder(slug),
        invalidateQueryKey: [...(invalidateQueryKey ?? []), WF_BASE_QUERYKEY],
    });
};

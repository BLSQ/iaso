import React from 'react';
import { UseMutationResult } from 'react-query';
import {
    getApiValidationWorkflowsListQueryKey,
    getApiValidationWorkflowsRetrieveQueryKey,
} from 'Iaso/api/validationWorkflows';
import {
    ValidationNodeTemplateCreateBody,
    ValidationNodeTemplateUpdateBody,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodeTemplates';
import { postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { getNodeTemplatesUrl, WF_BASE_QUERYKEY } from '../constants';

const saveNode = async ({
    workflowSlug,
    body,
}: {
    workflowSlug: string;
    body: ValidationNodeTemplateCreateBody;
}) => postRequest(getNodeTemplatesUrl(workflowSlug), body);

// Queries to refresh after adding or deleting a step
export const useNodeInvalidationQueryKey = (workflowSlug?: string) =>
    React.useMemo(
        () => [
            ...getApiValidationWorkflowsListQueryKey(),
            ...(workflowSlug
                ? getApiValidationWorkflowsRetrieveQueryKey(workflowSlug)
                : []),
            WF_BASE_QUERYKEY,
        ],
        [workflowSlug],
    ) as string[];

export const useSaveNode = (
    workflowSlug?: string,
): UseMutationResult<any, any> => {
    const invalidateQueryKey = useNodeInvalidationQueryKey(workflowSlug);
    return useSnackMutation({
        mutationFn: saveNode,
        invalidateQueryKey: invalidateQueryKey,
    });
};

type SaveStepsArgs = {
    steps: Array<ValidationNodeTemplateUpdateBody & { slug: string }>;
    // Bulk update rewrites the whole chain, so it is only used to reorder.
    reorder: boolean;
};

const saveSteps =
    (workflowSlug: string) =>
    ({ steps, reorder }: SaveStepsArgs): Promise<unknown> => {
        if (reorder) {
            return putRequest(
                `${getNodeTemplatesUrl(workflowSlug)}bulk/`,
                steps,
            );
        }
        return Promise.all(
            steps.map(({ slug, ...body }) =>
                putRequest(getNodeTemplatesUrl(workflowSlug, slug), body),
            ),
        );
    };

export const useSaveSteps = (workflowSlug: string) =>
    useSnackMutation<unknown, unknown, SaveStepsArgs>({
        mutationFn: saveSteps(workflowSlug),
        invalidateQueryKey: [
            ...getApiValidationWorkflowsRetrieveQueryKey(workflowSlug),
            WF_BASE_QUERYKEY,
        ],
    });

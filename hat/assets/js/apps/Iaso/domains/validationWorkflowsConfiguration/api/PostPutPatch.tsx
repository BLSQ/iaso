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

export const useSaveNode = (
    workflowSlug?: string,
): UseMutationResult<any, any> => {
    const queryKey = React.useMemo(() => {
        return [
            ...getApiValidationWorkflowsListQueryKey(),
            ...(workflowSlug
                ? getApiValidationWorkflowsRetrieveQueryKey(workflowSlug)
                : []),
        ] as string[];
    }, [workflowSlug]);
    const invalidateQueryKey = [...queryKey, WF_BASE_QUERYKEY];
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
                `${API_URL}${workflowSlug}/node-templates/bulk/`,
                steps,
            );
        }
        return Promise.all(
            steps.map(({ slug, ...body }) =>
                putRequest(
                    `${API_URL}${workflowSlug}/node-templates/${slug}/`,
                    body,
                ),
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

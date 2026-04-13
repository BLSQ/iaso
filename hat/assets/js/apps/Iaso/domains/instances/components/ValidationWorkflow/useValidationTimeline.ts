import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import {
    History,
    ValidationNodeRetrieveResponse,
} from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';
import {
    NestedNodeTemplate,
    ValidationWorkflowRetrieveResponseItem,
} from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';
import { userHasOneOfRoles } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../../messages';

const getRelatedNodeTemplate = (
    slug: string,
    nodeTemplates: NestedNodeTemplate[],
): [NestedNodeTemplate | undefined, number | undefined] => {
    const idx = nodeTemplates.findIndex(item => item.slug === slug);
    if (idx !== -1) {
        return [nodeTemplates[idx], idx];
    }
    return [undefined, undefined];
};

export type UseValidationTimelineResult = {
    nodeId?: number;
    label: string;
    color?: `#${string}`;
    order?: number;
    previous?: boolean;
    content: {
        description?: string;
        comment?: string;
        author?: string;
        date?: string;
    };
    nodeSlug: string;
    canValidate?: boolean;
} & Partial<Pick<History, 'status'>>;

export const useValidationTimeline = ({
    data,
    nodes,
}: {
    data?: ValidationNodeRetrieveResponse;
    nodes?: ValidationWorkflowRetrieveResponseItem;
}): UseValidationTimelineResult[] => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const templates = nodes?.node_templates ?? [];

        let results: UseValidationTimelineResult[] = [];

        // retrieve index of most recent new_version or submission
        const newVersionOrSubmissionIndex = data?.history.findIndex(
            step =>
                step.status === 'NEW_VERSION' || step.status === 'SUBMISSION',
        );

        data?.history
            .slice(
                0,
                newVersionOrSubmissionIndex === -1
                    ? undefined
                    : newVersionOrSubmissionIndex,
            )
            .filter(step => step.status !== 'UNKNOWN')
            .forEach(step => {
                const [relatedNodeTemplate, relatedNodeTemplateIdx] =
                    getRelatedNodeTemplate(step.node_template_slug, templates);

                if (relatedNodeTemplate) {
                    results.push({
                        nodeSlug: step.node_template_slug,
                        label: step.level,
                        color: step.color,
                        order:
                            relatedNodeTemplateIdx !== undefined
                                ? relatedNodeTemplateIdx + 1
                                : undefined,
                        content: {
                            description: relatedNodeTemplate?.description,
                            comment: step.comment ?? undefined,
                            author:
                                step.status !== 'UNKNOWN'
                                    ? (step?.updated_by ?? step.created_by)
                                    : undefined,
                            date:
                                step.status !== 'UNKNOWN'
                                    ? step.updated_at
                                    : undefined,
                        },
                        status: step.status,
                    });
                }
            });

        data?.next_tasks.forEach(task => {
            const [relatedNodeTemplate, relatedNodeTemplateIdx] =
                getRelatedNodeTemplate(task.node_template_slug, templates);
            if (relatedNodeTemplate) {
                results.push({
                    nodeId: task.id,
                    nodeSlug: task.node_template_slug,
                    label: relatedNodeTemplate.name,
                    color: relatedNodeTemplate.color,
                    order:
                        relatedNodeTemplateIdx !== undefined
                            ? relatedNodeTemplateIdx + 1
                            : undefined,
                    content: {
                        description: relatedNodeTemplate?.description,
                    },
                    canValidate: userHasOneOfRoles(
                        currentUser,
                        task?.user_roles?.map(role => role.id) ?? [],
                    ),
                });
            }
        });

        data?.next_bypass
            .filter(bypass =>
                results.some(result => result.nodeSlug !== bypass.slug),
            )
            .forEach(bypass => {
                const [relatedNodeTemplate, relatedNodeTemplateIdx] =
                    getRelatedNodeTemplate(bypass.slug, templates);

                if (relatedNodeTemplate) {
                    results.push({
                        nodeSlug: bypass.slug,
                        label: relatedNodeTemplate.name,
                        color: relatedNodeTemplate.color,
                        order:
                            relatedNodeTemplateIdx !== undefined
                                ? relatedNodeTemplateIdx + 1
                                : undefined,
                        content: {
                            description: relatedNodeTemplate?.description,
                        },
                        canValidate: userHasOneOfRoles(
                            currentUser,
                            bypass?.user_roles?.map(role => role.id) ?? [],
                        ),
                    });
                }
            });

        if (newVersionOrSubmissionIndex !== -1) {
            data?.history?.slice(newVersionOrSubmissionIndex).forEach(step => {
                const [relatedNodeTemplate, relatedNodeTemplateIdx] =
                    getRelatedNodeTemplate(step.node_template_slug, templates);

                const getLabel = (step: History): string => {
                    if (step.status === 'SUBMISSION') {
                        return formatMessage(
                            MESSAGES.validationNodeStatusSubmission,
                        );
                    } else if (step.status === 'NEW_VERSION') {
                        return formatMessage(
                            MESSAGES.validationNodeStatusNewVersion,
                        );
                    } else {
                        return step.level;
                    }
                };

                if (relatedNodeTemplate) {
                    results = [
                        {
                            previous: true, // means that it's not related to the current running validation workflow
                            nodeSlug: step.node_template_slug,
                            label: getLabel(step),
                            color: step.color,
                            order:
                                relatedNodeTemplateIdx !== undefined
                                    ? relatedNodeTemplateIdx + 1
                                    : undefined,
                            content: {
                                description: relatedNodeTemplate?.description,
                                comment: step.comment ?? undefined,
                                author:
                                    step.status !== 'UNKNOWN'
                                        ? (step?.updated_by ?? step.created_by)
                                        : undefined,
                                date:
                                    step.status !== 'UNKNOWN'
                                        ? step.updated_at
                                        : undefined,
                            },
                            status: step.status,
                        },
                        ...results,
                    ];
                }
            });
        }
        return results;
    }, [data, nodes, currentUser, formatMessage]);
};

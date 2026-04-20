import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import {
    NextByPass,
    NextTasks,
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

type DistributivePick<T, K extends PropertyKey> = T extends any
    ? Pick<T, Extract<keyof T, K>>
    : never;

type GetRelatedNodeTemplateResult =
    | { found: false }
    | { found: true; index: number; template: NestedNodeTemplate };

const getRelatedNodeTemplate = (
    slug: string,
    nodeTemplates: NestedNodeTemplate[],
): GetRelatedNodeTemplateResult => {
    const idx = nodeTemplates.findIndex(item => item.slug === slug);
    if (idx !== -1) {
        return {
            found: true,
            template: nodeTemplates[idx],
            index: idx,
        };
    }
    return { found: false };
};

const getLabelForPreviousHistory = (
    step: History,
    formatMessage: ReturnType<typeof useSafeIntl>['formatMessage'],
): string => {
    switch (step.status) {
        case 'SUBMISSION':
            return formatMessage(MESSAGES.validationNodeStatusSubmission);
        case 'NEW_VERSION':
            return formatMessage(MESSAGES.validationNodeStatusNewVersion);
        default:
            return step.level;
    }
};

type GetResultItemProps = (
    | {
          type: 'NEXT_BYPASS';
          data: NextByPass;
          currentUser: ReturnType<typeof useCurrentUser>;
      }
    | {
          type: 'PREVIOUS_HISTORY';
          data: History;
          formatMessage: ReturnType<typeof useSafeIntl>['formatMessage'];
      }
    | {
          type: 'NEXT_TASKS';
          data: NextTasks;
          currentUser: ReturnType<typeof useCurrentUser>;
      }
    | {
          type: 'HISTORY';
          data: History;
      }
) & {
    relatedNodeTemplateIdx: number;
    relatedNodeTemplate: NestedNodeTemplate;
    nodeTemplateSlug: string;
};

const getResultItem = (
    props: GetResultItemProps,
): UseValidationTimelineResult => {
    const {
        type,
        relatedNodeTemplate,
        relatedNodeTemplateIdx,
        nodeTemplateSlug,
        data,
    } = props;

    const common = {
        order: relatedNodeTemplateIdx + 1,
        nodeSlug: nodeTemplateSlug,
        color: relatedNodeTemplate?.color,
        label:
            type === 'PREVIOUS_HISTORY'
                ? getLabelForPreviousHistory(data, props.formatMessage)
                : relatedNodeTemplate.name,
    };
    switch (type) {
        case 'NEXT_BYPASS':
            return {
                ...common,
                content: {
                    description: relatedNodeTemplate?.description,
                },
                canValidate: userHasOneOfRoles(
                    props.currentUser,
                    data.user_roles?.map(role => role.id) ?? [],
                ),
            };
        case 'PREVIOUS_HISTORY':
            return {
                ...common,
                previous: true, // means that it's not related to the current running validation workflow
                content: {
                    description: relatedNodeTemplate?.description,
                    comment: data.comment ?? undefined,
                    author:
                        data.status !== 'UNKNOWN'
                            ? (data?.updated_by ?? data.created_by)
                            : undefined,
                    date:
                        data.status !== 'UNKNOWN' ? data.updated_at : undefined,
                },
                status: data.status,
            };
        case 'NEXT_TASKS':
            return {
                ...common,
                nodeId: data.id,
                content: {
                    description: relatedNodeTemplate?.description,
                },
                canValidate: userHasOneOfRoles(
                    props.currentUser,
                    data?.user_roles?.map(role => role.id) ?? [],
                ),
            };
        case 'HISTORY':
            return {
                ...common,
                content: {
                    description: relatedNodeTemplate?.description,
                    comment: data.comment ?? undefined,
                    author:
                        data.status !== 'UNKNOWN'
                            ? (data?.updated_by ?? data.created_by)
                            : undefined,
                    date:
                        data.status !== 'UNKNOWN' ? data.updated_at : undefined,
                },
                status: data.status,
            };
    }
};

type InsertIntoResultsProps = {
    results: UseValidationTimelineResult[];
    templates: NestedNodeTemplate[];
} & DistributivePick<
    GetResultItemProps,
    'type' | 'data' | 'nodeTemplateSlug' | 'currentUser' | 'formatMessage'
>;

const insertIntoResults = (props: InsertIntoResultsProps): void => {
    const { results, type, templates, nodeTemplateSlug, data } = props;

    const result = getRelatedNodeTemplate(nodeTemplateSlug, templates);

    if (!result.found) return;

    const base = {
        nodeTemplateSlug,
        relatedNodeTemplateIdx: result.index,
        relatedNodeTemplate: result.template,
    };

    if (type === 'PREVIOUS_HISTORY') {
        // we insert at the beginning of the array
        results.unshift(
            getResultItem({
                ...base,
                data,
                type,
                formatMessage: props.formatMessage,
            }),
        );
        return;
    }

    if (type === 'NEXT_TASKS') {
        results.push(
            getResultItem({
                ...base,
                data,
                type,
                currentUser: props.currentUser,
            }),
        );
        return;
    }

    if (type === 'NEXT_BYPASS') {
        results.push(
            getResultItem({
                ...base,
                data,
                type,
                currentUser: props.currentUser,
            }),
        );
        return;
    }

    results.push(
        getResultItem({
            ...base,
            data,
            type,
        }),
    );
};

export type UseValidationTimelineResult = {
    nodeId?: number;
    label: string;
    color?: `#${string}`;
    order: number;
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

        const results: UseValidationTimelineResult[] = [];

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
            .toReversed()
            .forEach(step => {
                insertIntoResults({
                    results,
                    templates,
                    nodeTemplateSlug: step.node_template_slug,
                    type: 'HISTORY',
                    data: step,
                });
            });

        data?.next_tasks.forEach(task => {
            insertIntoResults({
                results,
                templates,
                nodeTemplateSlug: task.node_template_slug,
                type: 'NEXT_TASKS',
                data: task,
                currentUser,
            });
        });
        data?.next_bypass
            .filter(
                bypass =>
                    !results.some(result => result.nodeSlug === bypass.slug),
            )
            .forEach(bypass => {
                insertIntoResults({
                    results,
                    templates,
                    nodeTemplateSlug: bypass.slug,
                    type: 'NEXT_BYPASS',
                    data: bypass,
                    currentUser,
                });
            });

        if (newVersionOrSubmissionIndex !== -1) {
            data?.history?.slice(newVersionOrSubmissionIndex).forEach(step => {
                insertIntoResults({
                    results,
                    templates,
                    nodeTemplateSlug: step.node_template_slug,
                    type: 'PREVIOUS_HISTORY',
                    data: step,
                    formatMessage,
                });
            });
        }
        return results;
    }, [data, nodes, currentUser, formatMessage]);
};

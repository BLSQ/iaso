import { useMemo } from 'react';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';
import { ValidationWorkflowRetrieveResponseItem } from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';
import { userHasOneOfRoles } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

export const useValidationTimeline = ({
    data,
    nodes,
}: {
    data: ValidationNodeRetrieveResponse;
    nodes: ValidationWorkflowRetrieveResponseItem;
}) => {
    const currentUser = useCurrentUser();
    return useMemo(() => {
        const templates = nodes?.node_templates ?? [];
        const result = templates.map(node => {
            return {
                label: node.name,
                content: { description: node.description },
                status: 'inactive',
                color: node.color,
            };
        });

        data?.history.forEach(step => {
            const index = templates.findIndex(node => {
                return step.level === node.name;
            });

            if (index >= 0) {
                result[index] = {
                    ...result[index],
                    content: {
                        comment:
                            step.status !== 'UNKNOWN'
                                ? step.comment
                                : undefined,
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
                };
            }
        });
        data?.next_bypass.forEach(bypass => {
            const index = templates.findIndex(node => {
                return bypass.name === node.name;
            });

            if (index >= 0) {
                result[index] = {
                    ...result[index],
                    nodeSlug: bypass.slug,
                    canValidate: userHasOneOfRoles(
                        currentUser,
                        bypass?.user_roles?.map(role => role.id) ?? [],
                    ),
                };
            }
        });
        data?.next_tasks.forEach(task => {
            const index = templates.findIndex(node => {
                return task.name === node.name;
            });

            if (index >= 0) {
                result[index] = {
                    ...result[index],
                    nodeId: task.id,
                    canValidate: userHasOneOfRoles(
                        currentUser,
                        task?.user_roles?.map(role => role.id) ?? [],
                    ),
                };
            }
        });
        return result;
    }, [data, nodes, currentUser]);
};

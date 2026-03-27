import { useMemo } from 'react';
import { userHasOneOfRoles } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

export const useValidationTimeline = ({ data, nodes }) => {
    const currentUser = useCurrentUser();
    return useMemo(() => {
        const templates = nodes?.nodeTemplates ?? [];
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
                                ? (step?.updatedBy ?? step.createdBy)
                                : undefined,
                        date:
                            step.status !== 'UNKNOWN'
                                ? step.updatedAt
                                : undefined,
                    },
                    status: step.status,
                };
            }
        });
        data?.nextBypass.forEach(bypass => {
            const index = templates.findIndex(node => {
                return bypass.name === node.name;
            });

            if (index >= 0) {
                result[index] = {
                    ...result[index],
                    nodeSlug: bypass.slug,
                    canValidate: userHasOneOfRoles(
                        currentUser,
                        bypass.userRoles.map(role => role.id),
                    ),
                };
            }
        });
        data?.nextTasks.forEach(task => {
            const index = templates.findIndex(node => {
                return task.name === node.name;
            });

            if (index >= 0) {
                result[index] = {
                    ...result[index],
                    nodeId: task.id,
                    canValidate: userHasOneOfRoles(
                        currentUser,
                        task.userRoles.map(role => role.id),
                    ),
                };
            }
        });
        return result;
    }, [data, nodes, currentUser]);
};

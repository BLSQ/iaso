import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { useGetStatus } from 'Iaso/domains/workflows/hooks/useGetStatus';
import { Status } from 'Iaso/domains/workflows/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';

type WorkflowVersionItem = {
    version_id: number;
    name: string;
    status: Status;
};

export type WorkflowVersionOption = {
    value: number;
    label: string;
    status: Status;
};

/** The entity type's workflow versions, newest first, as "name · status" options. */
export const useGetWorkflowVersionOptions = (
    entityTypeId?: number | null,
): UseQueryResult<WorkflowVersionOption[], Error> => {
    const statuses = useGetStatus();
    const statusLabels = useMemo(
        () =>
            Object.fromEntries(
                statuses.map(status => [status.value, status.label]),
            ),
        [statuses],
    );
    return useSnackQuery({
        queryKey: ['scenarioWorkflowVersions', entityTypeId],
        queryFn: () =>
            getRequest(
                makeUrlWithParams('/api/workflowversions/', {
                    workflow__entity_type: entityTypeId ?? undefined,
                    order: '-id',
                }),
            ),
        options: {
            enabled: Boolean(entityTypeId),
            select: (data: { workflow_versions: WorkflowVersionItem[] }) =>
                data.workflow_versions.map(version => ({
                    value: version.version_id,
                    label: `${version.name} · ${statusLabels[version.status] ?? version.status}`,
                    status: version.status,
                })),
        },
    });
};

/** The version to test against: the one in the url, else the published one, else the newest. */
export const getDefaultVersionId = (
    options: WorkflowVersionOption[],
    versionId?: string,
): number | undefined =>
    versionId
        ? Number(versionId)
        : (options.find(option => option.status === 'PUBLISHED') ?? options[0])
              ?.value;

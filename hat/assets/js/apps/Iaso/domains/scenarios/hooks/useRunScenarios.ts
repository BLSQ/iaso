import { useCallback } from 'react';
import { useApiScenariosRunCreate } from 'Iaso/api/scenarios';
import MESSAGES from '../messages';

/** Runs scenarios against a workflow version (none: their entity type's published one). */
export const useRunScenarios = (
    workflowVersionId?: number,
): { run: (scenarioIds: number[]) => void; isRunning: boolean } => {
    const { mutate, isLoading } = useApiScenariosRunCreate({
        mutation: {
            meta: {
                snackSuccessMessage: MESSAGES.runDone,
                useApiErrorMessage: true,
            },
        },
    });
    const run = useCallback(
        (scenarioIds: number[]) =>
            mutate({
                data: {
                    scenario_ids: scenarioIds,
                    workflow_version_id: workflowVersionId ?? null,
                },
            }),
        [mutate, workflowVersionId],
    );
    return { run, isRunning: isLoading };
};

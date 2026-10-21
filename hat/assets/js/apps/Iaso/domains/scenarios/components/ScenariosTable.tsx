import React, { FunctionComponent, useCallback } from 'react';
import { TableComponentProps } from 'bluesquare-components';
import { ScenarioList, useApiScenariosDestroy } from 'Iaso/api/scenarios';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { useScenariosColumns } from '../config';
import MESSAGES from '../messages';

type Props = {
    scenarios: ScenarioList[];
    isFetching: boolean;
    workflowVersionId?: number;
    onRun: (scenarioIds: number[]) => void;
    isRunning: boolean;
    params: TableComponentProps['params'];
    baseUrl: string;
};

/** The scenarios, their journey and last result; a scenario's name opens its page. */
export const ScenariosTable: FunctionComponent<Props> = ({
    scenarios,
    isFetching,
    workflowVersionId,
    onRun,
    isRunning,
    params,
    baseUrl,
}) => {
    const { mutate: deleteScenario } = useApiScenariosDestroy();
    const handleDelete = useCallback(
        (scenarioId: number) => deleteScenario({ id: scenarioId }),
        [deleteScenario],
    );
    const columns = useScenariosColumns({
        workflowVersionId,
        onRun,
        onDelete: handleDelete,
        isRunning,
    });
    return (
        <TableWithDeepLink
            marginTop={false}
            countOnTop={false}
            elevation={0}
            showPagination={false}
            baseUrl={baseUrl}
            paramsPrefix="scenarios"
            data={scenarios}
            pages={1}
            count={scenarios.length}
            columns={columns}
            params={params}
            extraProps={{ loading: isFetching, isRunning, workflowVersionId }}
            noDataMessage={MESSAGES.noScenarios}
        />
    );
};

import React, { FunctionComponent, useMemo } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button } from '@mui/material';
import {
    LinkWithLocation,
    TableComponentProps,
    useSafeIntl,
} from 'bluesquare-components';
import { useApiScenariosList } from 'Iaso/api/scenarios';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import { useRunScenarios } from '../hooks/useRunScenarios';
import MESSAGES from '../messages';
import { ImportScenariosButton } from './ImportScenariosButton';
import { ScenariosTable } from './ScenariosTable';

const styles: SxStyles = {
    actions: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 2,
        m: 2,
    },
};

type Props = {
    entityTypeId: number;
    workflowVersionId: number;
    params: TableComponentProps['params'];
    baseUrl: string;
};

/** On a workflow version's page: the entity type's scenarios, run against this version (draft or published). */
export const ScenariosPanel: FunctionComponent<Props> = ({
    entityTypeId,
    workflowVersionId,
    params,
    baseUrl,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useApiScenariosList({
        entity_type_id: entityTypeId,
        kind: 'entity',
    });
    const scenarios = useMemo(() => data?.results ?? [], [data]);
    const { run, isRunning } = useRunScenarios(workflowVersionId);

    return (
        <WidgetPaper title={formatMessage(MESSAGES.scenarios)}>
            <ScenariosTable
                scenarios={scenarios}
                isFetching={isFetching}
                workflowVersionId={workflowVersionId}
                onRun={run}
                isRunning={isRunning}
                params={params}
                baseUrl={baseUrl}
            />
            <Box sx={styles.actions}>
                <LinkWithLocation
                    to={`/${baseUrls.scenarios}/entityTypeId/${entityTypeId}/versionId/${workflowVersionId}`}
                >
                    {formatMessage(MESSAGES.openScenariosPage)}
                </LinkWithLocation>
                <ImportScenariosButton />
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    disabled={scenarios.length === 0 || isRunning}
                    onClick={() => run(scenarios.map(scenario => scenario.id))}
                >
                    {formatMessage(MESSAGES.runAll)}
                </Button>
            </Box>
        </WidgetPaper>
    );
};

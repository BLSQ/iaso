import React, { FunctionComponent } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { IconButton } from 'bluesquare-components';
import { apiScenariosRetrieve, ScenarioList } from 'Iaso/api/scenarios';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import MESSAGES from '../messages';
import { downloadJson, scenarioFileName } from '../utils';

type Props = {
    scenario: ScenarioList;
    onRun: (scenarioIds: number[]) => void;
    onDelete: (scenarioId: number) => void;
    isRunning: boolean;
};

export const ActionsCell: FunctionComponent<Props> = ({
    scenario,
    onRun,
    onDelete,
    isRunning,
}) => {
    const handleDownload = async () => {
        const { definition } = await apiScenariosRetrieve(scenario.id);
        downloadJson(scenarioFileName(scenario.name), definition);
    };
    return (
        <>
            <IconButton
                overrideIcon={PlayArrowIcon}
                tooltipMessage={MESSAGES.run}
                disabled={isRunning}
                onClick={() => onRun([scenario.id])}
            />
            <IconButton
                overrideIcon={DownloadIcon}
                tooltipMessage={MESSAGES.download}
                onClick={handleDownload}
            />
            <DeleteModal
                type="icon"
                titleMessage={MESSAGES.deleteScenario}
                onConfirm={() => onDelete(scenario.id)}
                backdropClick
            />
        </>
    );
};

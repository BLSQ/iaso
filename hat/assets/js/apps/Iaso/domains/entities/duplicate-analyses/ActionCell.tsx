import React, { FC, useMemo } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { TaskModal } from 'Iaso/domains/tasks/components/TaskModal';
import { Task } from 'Iaso/domains/tasks/types';
import { LEVENSHTEIN_PARAMETERS_DROPDOWN } from '../constants';
import MESSAGES from '../duplicates/messages';
import { Analysis } from '../duplicates/types';
import { useGetEntityTypesDropdown } from '../hooks/requests';

type Props = {
    status: string;
    onRelaunch: () => void;
    taskId: number;
    analysis: Analysis;
};

export const ActionCell: FC<Props> = ({
    status,
    taskId,
    onRelaunch,
    analysis,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: entityTypes } = useGetEntityTypesDropdown();
    const taskParams = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.algorithm),
                value: analysis?.algorithm,
            },
            {
                label: formatMessage(MESSAGES.user),
                value: analysis?.created_by?.username,
            },
            {
                label: formatMessage(MESSAGES.entityType),
                value: entityTypes?.find(
                    t => t.value.toString() === analysis?.entity_type_id,
                )?.label,
            },
            {
                label: formatMessage(MESSAGES.fields),
                value: analysis?.fields?.join(', '),
            },
            ...LEVENSHTEIN_PARAMETERS_DROPDOWN.map(lp => ({
                label: [lp.label],
                value: analysis?.parameters?.[lp.value],
            })),
        ],
        [formatMessage, analysis, entityTypes],
    );

    return (
        <>
            <IconButton
                onClick={onRelaunch}
                overrideIcon={HistoryIcon}
                tooltipMessage={MESSAGES.relaunchAnalysis}
                disabled={status === 'RUNNING'}
            />
            <TaskModal
                task={{ id: taskId, status: status } as Task<any>}
                taskParams={taskParams}
                iconProps={{}}
            />
        </>
    );
};

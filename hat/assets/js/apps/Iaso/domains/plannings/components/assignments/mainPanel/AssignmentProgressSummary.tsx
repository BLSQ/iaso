import React, { FC } from 'react';
import { LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { AssignmentProgress } from './utils';

const styles = {
    summary: {
        alignItems: 'center',
        gap: 1,
        mx: 1,
        minWidth: 0,
    },
    bar: {
        flex: '0 1 80px',
        minWidth: 24,
        height: 6,
        borderRadius: 3,
    },
    label: {
        whiteSpace: 'nowrap',
    },
} satisfies SxStyles;

type Props = {
    progress: AssignmentProgress;
};

export const AssignmentProgressSummary: FC<Props> = ({ progress }) => {
    const { formatMessage } = useSafeIntl();
    const { selectedTeam } = useAssignmentsContext();
    if (!progress.total) return null;
    return (
        <Tooltip
            title={formatMessage(MESSAGES.assignmentProgressHelp, {
                team: selectedTeam.name,
            })}
        >
            <Stack direction="row" sx={styles.summary}>
                <LinearProgress
                    variant="determinate"
                    value={(progress.assigned / progress.total) * 100}
                    sx={styles.bar}
                />
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={styles.label}
                >
                    {formatMessage(
                        MESSAGES.belowAssigned,
                        numericValues(progress),
                    )}
                </Typography>
            </Stack>
        </Tooltip>
    );
};

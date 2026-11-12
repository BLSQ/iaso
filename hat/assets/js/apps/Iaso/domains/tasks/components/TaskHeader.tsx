import React, { FunctionComponent } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { Task } from '../types';
import { getStatusColor, getTranslatedStatusMessage } from './StatusCell';

const styles: SxStyles = {
    title: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 1,
        rowGap: 0.5,
    },
    name: {
        overflowWrap: 'anywhere',
    },
    id: {
        fontFamily: 'monospace',
    },
    statusChip: {
        color: 'white',
    },
};

type Props = {
    task: Task<any>;
};

export const TaskHeader: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            <Box sx={styles.title}>
                <Typography
                    variant="h5"
                    component="h2"
                    color="primary"
                    sx={styles.name}
                >
                    {task.name}
                </Typography>
                <Typography color="text.secondary" sx={styles.id}>
                    #{task.id}
                </Typography>
                <Chip
                    label={getTranslatedStatusMessage(
                        formatMessage,
                        task.status,
                    )}
                    color={getStatusColor(task.status)}
                    size="small"
                    sx={styles.statusChip}
                />
                {task.should_be_killed && task.status === 'RUNNING' && (
                    <Chip
                        label={formatMessage(MESSAGES.stopRequested)}
                        color="warning"
                        variant="outlined"
                        size="small"
                    />
                )}
                {task.external && (
                    <Chip
                        label={formatMessage(MESSAGES.external)}
                        variant="outlined"
                        size="small"
                    />
                )}
            </Box>
            <Typography variant="body2" color="text.secondary">
                {moment.unix(task.created_at).format('LTS')}
            </Typography>
        </Box>
    );
};

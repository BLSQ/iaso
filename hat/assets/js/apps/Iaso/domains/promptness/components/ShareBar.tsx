import React, { FunctionComponent } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import {
    PROMPTNESS_STATUSES,
    STATUS_COLORS,
    STATUS_FIELDS,
    STATUS_MESSAGES,
} from '../constants';
import { PromptnessCounts } from '../types';
import { formatPercent } from '../utils';

type Props = {
    counts: PromptnessCounts;
};

const styles: SxStyles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    bar: {
        display: 'flex',
        flexGrow: 1,
        height: 8,
        minWidth: 80,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'grey.200',
    },
    label: {
        minWidth: 35,
        textAlign: 'right',
    },
};

// Stacked bar of the on time / late / missing percentages, labelled with the on time one
export const ShareBar: FunctionComponent<Props> = ({ counts }) => {
    const { formatMessage } = useSafeIntl();
    const segments = PROMPTNESS_STATUSES.map(status => ({
        status,
        percent: counts[`${STATUS_FIELDS[status]}_percent`],
    }));
    return (
        <Box sx={styles.root}>
            <Box sx={styles.bar}>
                {segments.map(({ status, percent }) =>
                    percent ? (
                        <Tooltip
                            key={status}
                            title={`${formatMessage(STATUS_MESSAGES[status])}: ${formatPercent(percent)}`}
                        >
                            <Box
                                width={`${percent}%`}
                                bgcolor={STATUS_COLORS[status]}
                            />
                        </Tooltip>
                    ) : null,
                )}
            </Box>
            <Typography variant="body2" sx={styles.label}>
                {formatPercent(counts.on_time_percent)}
            </Typography>
        </Box>
    );
};

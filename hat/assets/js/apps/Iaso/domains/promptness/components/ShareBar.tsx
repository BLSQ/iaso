import React, { FunctionComponent } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import {
    STATUS_COLORS,
    STATUS_LATE,
    STATUS_MESSAGES,
    STATUS_MISSING,
    STATUS_ON_TIME,
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
    const segments = [
        { status: STATUS_ON_TIME, percent: counts.on_time_percent },
        { status: STATUS_LATE, percent: counts.late_percent },
        { status: STATUS_MISSING, percent: counts.missing_percent },
    ];
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

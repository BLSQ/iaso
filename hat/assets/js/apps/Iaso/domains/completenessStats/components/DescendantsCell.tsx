import React, { ReactElement } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Tooltip, Box, Theme, SxProps } from '@mui/material';

import { FormStatRow } from '../types';
import MESSAGES from '../messages';
import { LinearProgressWithLabel } from './LinearProgressWithLabel';
import { useEffectiveThreshold } from '../hooks/useEffectiveThreshold';
import { Legend, useGetLegend } from '../../../components/LegendBuilder/Legend';

const styles: SxProps<Theme> = {
    root: {
        cursor: 'pointer',
    },
    tooltip: {
        color: 'text.primary',
        bgcolor: 'background.paper',
        boxShadow: (theme: Theme) => theme.shadows[1],
        '& .MuiTooltip-arrow': {
            color: 'background.paper',
        },
    },
    noResult: {
        textDecoration: 'underline dotted',
    },
};

export const DescendantsCell = ({ value }: FormStatRow): ReactElement => {
    const { formatMessage } = useSafeIntl();
    const effectiveThreshold = useEffectiveThreshold(value.legend_threshold);
    const getLegend = useGetLegend(effectiveThreshold);
    const color = getLegend(value.percent);

    return value.descendants > 0 ? (
        <Box sx={styles.root}>
            <Tooltip
                title={
                    <Box p={1}>
                        <Legend threshold={effectiveThreshold} />
                    </Box>
                }
                placement="right"
                arrow
                componentsProps={{
                    tooltip: {
                        sx: styles.tooltip,
                    },
                }}
            >
                <Box>
                    <LinearProgressWithLabel
                        value={value.percent}
                        color={color}
                        extraLabel={`${value.descendants_ok} / ${value.descendants}`}
                    />
                </Box>
            </Tooltip>
        </Box>
    ) : (
        <Box title={formatMessage(MESSAGES.descendantsNoSubmissionExpected)}>
            N/A
        </Box>
    );
};

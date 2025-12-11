import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { LqasDataForChart } from '../../types';
import { PercentageBarChart } from './PercentageBarChart';
import { GraphTooltipFormatter } from './PercentageBarChart/types';

type Props = {
    title?: string;
    data: LqasDataForChart[];
    tooltipFormatter: GraphTooltipFormatter;
    isLoading: boolean;
    chartKey: string;
    showChart: boolean;
    colorThresholds: { ok: number; warning: number };
};

export const PercentageChartWithTitle: FunctionComponent<Props> = ({
    title,
    data,
    tooltipFormatter,
    isLoading,
    chartKey,
    showChart,
    colorThresholds,
}) => {
    return (
        <>
            {isLoading && <LoadingSpinner fixed={false} />}
            {!isLoading && showChart && (
                <>
                    {title && (
                        <Box>
                            <Typography variant="h6">{title}</Typography>{' '}
                        </Box>
                    )}
                    <PercentageBarChart
                        data={data}
                        tooltipFormatter={tooltipFormatter}
                        chartKey={chartKey}
                        colorThresholds={colorThresholds}
                    />
                </>
            )}
        </>
    );
};

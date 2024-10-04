import { Box, Typography } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { PercentageBarChart } from './PercentageBarChart';

type Props = {
    // eslint-disable-next-line react/require-default-props
    title?: string;
    data: any[];
    tooltipFormatter: (...args: any) => any;
    isLoading: boolean;
    chartKey: string;
    showChart: boolean;
    colorTresholds: { ok: number; warning: number };
};

export const PercentageChartWithTitle: FunctionComponent<Props> = ({
    title,
    data,
    tooltipFormatter,
    isLoading,
    chartKey,
    showChart,
    colorTresholds,
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
                        colorTresholds={colorTresholds}
                    />
                </>
            )}
        </>
    );
};

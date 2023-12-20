import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
// @ts-ignore
import { LoadingSpinner } from 'bluesquare-components';
import { PercentageBarChart } from './PercentageBarChart';

type Props = {
    // eslint-disable-next-line react/require-default-props
    title?: string;
    data: any[];
    // eslint-disable-next-line no-unused-vars
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

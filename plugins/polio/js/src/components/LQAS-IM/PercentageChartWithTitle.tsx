import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@material-ui/core';
import { LoadingSpinner } from 'bluesquare-components';
import { PercentageBarChart } from '../PercentageBarChart';

type Props = {
    title: string;
    data: any[];
    // eslint-disable-next-line no-unused-vars
    tooltipFormatter: (args: any) => any;
    isLoading: boolean;
    chartKey: string;
    showChart: boolean;
};

export const PercentageChartWithTitle: FunctionComponent<Props> = ({
    title,
    data,
    tooltipFormatter,
    isLoading,
    chartKey,
    showChart,
}) => {
    return (
        <>
            {isLoading && <LoadingSpinner />}
            {!isLoading && showChart && (
                <>
                    <Box>
                        <Typography variant="h6">{title}</Typography>{' '}
                    </Box>
                    <PercentageBarChart
                        data={data}
                        tooltipFormatter={tooltipFormatter}
                        chartKey={chartKey}
                    />
                </>
            )}
        </>
    );
};

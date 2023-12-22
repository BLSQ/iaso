import React, { FunctionComponent, useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from 'recharts';
import { blue } from '@mui/material/colors';
import { BarChartData } from '../../../constants/types';
import { BAR_HEIGHT } from './PercentageBarChart/constants';
import { CustomTick } from './CustomTick';
import { customLabelHorizontal } from './PercentageBarChart/utils';
import { NoData } from './NoData';
import { verticalChartTooltipFormatter } from './LqasIm';

type Props = {
    // eslint-disable-next-line react/require-default-props
    data?: BarChartData[];
    chartKey: string;
    isLoading: boolean;
    showChart: boolean;
    title: string;
};

export const LqasImVerticalChart: FunctionComponent<Props> = ({
    data = [],
    chartKey,
    isLoading,
    showChart,
    title,
}) => {
    const [renderCount, setRenderCount] = useState(0);
    const dataIsEmpty = data.length === 0;

    // Force render to avoid visual bug when data has length of 0
    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [data]);
    return (
        <>
            {!isLoading && showChart && dataIsEmpty && <NoData />}
            {!isLoading && showChart && !dataIsEmpty && (
                <>
                    <Box>
                        <Typography variant="h6">{title}</Typography>
                    </Box>
                    <Box key={`${chartKey}${renderCount}`}>
                        <ResponsiveContainer height={450} width="90%">
                            <BarChart
                                data={data}
                                layout="horizontal"
                                margin={{ left: 50 }}
                                barSize={BAR_HEIGHT}
                            >
                                <YAxis domain={[0, 100]} type="number" />
                                <XAxis
                                    type="category"
                                    dataKey="name"
                                    interval={0}
                                    height={110}
                                    tick={<CustomTick />}
                                />
                                <Tooltip
                                    payload={data}
                                    formatter={verticalChartTooltipFormatter}
                                    itemStyle={{ color: 'black' }}
                                />
                                <Bar dataKey="value" minPointSize={3}>
                                    {data.map((_entry, index) => {
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={blue[500]}
                                            />
                                        );
                                    })}
                                    <LabelList
                                        dataKey="value"
                                        content={customLabelHorizontal}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </>
            )}
        </>
    );
};

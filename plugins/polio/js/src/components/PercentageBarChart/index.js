import React, { useEffect, useState } from 'react';
import { array, func, string } from 'prop-types';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LabelList,
} from 'recharts';
import { Box, Typography } from '@material-ui/core';

const BAR_HEIGHT = 40;
const customLabel = ({ x, y, width, height, value }) => {
    const labelPosition = value > 20 ? x : x + width;
    const alignment = value > 20 ? 'end' : 'start';
    const color = value > 20 ? 'white' : 'black';
    // using BAR_HEIGHT here is arbitrary. We just need a value that ensures all text can be displayed, as small widths will crop
    const adjustedWidth = width > 55 ? width : 55;
    return (
        <g>
            <foreignObject
                x={labelPosition}
                y={y}
                width={adjustedWidth}
                height={height}
            >
                <Box
                    alignContent="start"
                    alignItems="center"
                    justifyContent={alignment}
                    height={BAR_HEIGHT}
                    width={width}
                    display="flex"
                    ml={1}
                    mr={1}
                    pr={2}
                    style={{ color }}
                >
                    <Typography>{`${value}%`}</Typography>
                </Box>
            </foreignObject>
        </g>
    );
};

export const PercentageBarChart = ({
    data,
    tooltipFormatter,
    fillColor,
    chartKey,
}) => {
    const [renderCount, setRenderCount] = useState(0);

    const chartHeight = BAR_HEIGHT * data.length + 100;
    // Force render to avoid visual bug when data has length of 0
    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [data]);
    return (
        <Box key={`${chartKey}${renderCount}`}>
            <ResponsiveContainer height={chartHeight} width="90%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ left: 50 }}
                    barSize={BAR_HEIGHT}
                >
                    <XAxis
                        type="number"
                        tickFormatter={value => `${value}%`}
                        domain={[0, 100]}
                    />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip
                        payload={data}
                        formatter={tooltipFormatter ?? undefined}
                        itemStyle={{ color: 'black' }}
                    />
                    <Bar dataKey="value" fill={fillColor} minPointSize={3}>
                        <LabelList dataKey="value" content={customLabel} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

PercentageBarChart.propTypes = {
    data: array,
    fillColor: string,
    tooltipFormatter: func,
    chartKey: string.isRequired,
};
PercentageBarChart.defaultProps = {
    data: [],
    fillColor: 'green',
    tooltipFormatter: null,
};

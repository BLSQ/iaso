import React, { useEffect, useState } from 'react';
import { oneOf, array } from 'prop-types';
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
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

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

export const LqasChart = ({ data, regions, round }) => {
    const [renderCount, setRenderCount] = useState(0);
    const { formatMessage } = useSafeIntl();
    const barChartData = regions.map(region => {
        const regionData = data.filter(
            district => district.region === region.id,
        );
        const passing = regionData.filter(
            district => parseInt(district.status, 10) === 1,
        ).length;
        const percentSuccess =
            // fallback to 1 to avoid dividing by zero
            (passing / (regionData.length || 1)) * 100;
        const roundedPercentSuccess = Number.isSafeInteger(percentSuccess)
            ? percentSuccess
            : percentSuccess.toFixed(2);
        return {
            name: region.name,
            value: roundedPercentSuccess,
            found: regionData.length,
            passing,
        };
    });
    const chartHeight = BAR_HEIGHT * barChartData.length + 100;
    // Force render to avoid visual bug when data has length of 0
    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [data, regions]);
    return (
        <Box key={`${round}${renderCount}`}>
            <Box>
                <Typography variant="h6">
                    {formatMessage(MESSAGES[round])}
                </Typography>{' '}
            </Box>
            <ResponsiveContainer height={chartHeight} width="90%">
                <BarChart
                    data={barChartData}
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
                        payload={barChartData}
                        formatter={(value, name, props) => {
                            // eslint-disable-next-line react/prop-types
                            const ratio = `${props.payload.passing}/${props.payload.found}`;
                            return [ratio, 'passing'];
                        }}
                        itemStyle={{ color: 'black' }}
                    />
                    {/* <Legend /> */}
                    <Bar dataKey="value" fill="green" minPointSize={3}>
                        <LabelList dataKey="value" content={customLabel} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

LqasChart.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    data: array,
    regions: array,
};
LqasChart.defaultProps = {
    data: [],
    regions: [],
};

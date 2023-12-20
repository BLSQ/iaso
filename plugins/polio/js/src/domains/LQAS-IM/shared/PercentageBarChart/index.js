import React, { useEffect, useState } from 'react';
import { array, func, object, string } from 'prop-types';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LabelList,
    Cell,
} from 'recharts';
import { Box } from '@mui/material';
import {
    FAIL_COLOR,
    OK_COLOR,
    WARNING_COLOR,
} from '../../../../styles/constants';
import { determineColor, customLabel } from './utils';
import { BAR_HEIGHT } from './constants';

export const PercentageBarChart = ({
    data,
    tooltipFormatter,
    colorPalette,
    colorTresholds,
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
                    <Bar dataKey="value" minPointSize={3}>
                        {data.map((entry, index) => {
                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={determineColor(
                                        entry,
                                        colorPalette,
                                        colorTresholds,
                                    )}
                                />
                            );
                        })}
                        <LabelList dataKey="value" content={customLabel} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

PercentageBarChart.propTypes = {
    data: array,
    tooltipFormatter: func,
    chartKey: string.isRequired,
    colorPalette: object,
    colorTresholds: object,
};
PercentageBarChart.defaultProps = {
    data: [],
    colorPalette: {
        ok: OK_COLOR,
        warning: WARNING_COLOR,
        fail: FAIL_COLOR,
    },
    colorTresholds: {
        ok: 95,
        warning: 90,
    },
    tooltipFormatter: null,
};

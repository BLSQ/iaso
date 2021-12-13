import React from 'react';
import { oneOf, object, string, array } from 'prop-types';
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

export const LqasChart = ({ data, regions }) => {
    // console.log('data', data);
    // console.log('regions', regions);
    const barChartData = regions.map(region => {
        const regionData = data.filter(
            district => district.region === region.id,
        );
        const percentSuccess =
            // fallback to 1 to avoid dividing by zero
            (regionData.filter(district => parseInt(district.status, 10) === 1)
                .length / regionData.length || 1) * 100;
        // console.log('percent', percentSuccess);
        return {
            name: region.name,
            value: percentSuccess,
        };
    });
    return (
        <ResponsiveContainer height={800} width="90%">
            <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ left: 50 }}
            >
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip payload={barChartData} />
                <Legend />
                <Bar dataKey="value" fill="green" label unit="%" />
            </BarChart>
        </ResponsiveContainer>
    );
};

LqasChart.propTypes = {
    // round: oneOf(['round_1', 'round_2']).isRequired,
    // lqasData: object,
    // shapes: array,
    // campaign: string,
    data: array,
    regions: array,
};
LqasChart.defaultProps = {
    // lqasData: {},
    // shapes: {},
    // campaign: '',
    data: [],
    regions: [],
};

import React from 'react';
import { useQuery } from 'react-query';
import { LoadingSpinner } from 'bluesquare-components';
import {
    Bar,
    BarChart,
    CartesianGrid,
    // Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { getChipColors } from '../constants/chipColors';
import { iasoGetRequest } from '../utils/requests';
import { Typography } from '@material-ui/core';

export const InstancesPerFormGraph = () => {
    const { data, isLoading } = useQuery(['instances', 'stats'], () =>
        iasoGetRequest({
            requestParams: {
                url: '/api/instances/stats/',
            },
            disableSuccessSnackBar: true,
        }),
    );
    console.count('InstancesPerFormGraph RERENDER');

    return (
        <>
            <Typography variant="h5">New instances per month</Typography>
            {isLoading && <LoadingSpinner />}
            {data && (
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                        width={500}
                        height={300}
                        data={data.data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        {/*<Legend />*/}
                        {data.schema.fields
                            .filter(f => f.type === 'number')
                            .map((f, i) => (
                                <Bar
                                    key={f.name}
                                    dataKey={f.name}
                                    stackId="a"
                                    fill={getChipColors(i)}
                                />
                            ))}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </>
    );
};

import React from 'react';
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
import { Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getChipColors } from '../constants/chipColors';

export const InstancesPerFormGraph = () => {
    const { data, isLoading } = useSnackQuery(['instances', 'stats'], () =>
        getRequest('/api/instances/stats/'),
    );

    return (
        <>
            <Typography variant="h5">
                <FormattedMessage
                    id="iaso.form.stats.submissionsPerMonthTitle"
                    defaultMessage="New submissions per month"
                />
            </Typography>
            {isLoading && <LoadingSpinner fixed={false} />}
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
                        {data.data?.length > 0 && <XAxis dataKey="name" />}
                        <YAxis />
                        <Tooltip />
                        {/* <Legend /> */}
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

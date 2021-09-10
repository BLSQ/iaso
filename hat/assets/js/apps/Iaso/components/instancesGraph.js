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
import { Typography } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { getChipColors } from '../constants/chipColors';
import { iasoGetRequest } from '../utils/requests';

export const InstancesPerFormGraph = () => {
    const { data, isLoading } = useQuery(['instances', 'stats'], () =>
        iasoGetRequest({
            requestParams: {
                url: '/api/instances/stats/',
            },
            disableSuccessSnackBar: true,
        }),
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

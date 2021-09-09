import React from 'react';
import { useQuery } from 'react-query';
import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { iasoGetRequest } from '../utils/requests';
import { Typography } from '@material-ui/core';
import { LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';

export const InstancesTotalGraph = () => {
    const { data, isLoading } = useQuery(['instances', 'stats_sum'], () =>
        iasoGetRequest({
            requestParams: {
                url: '/api/instances/stats_sum/',
            },
            disableSuccessSnackBar: true,
        }),
    );

    return (
        <>
            <Typography variant="h5">
                <FormattedMessage
                    id="iaso.form.stats.all_submission_title"
                    defaultMessage="All Submissions"
                />
            </Typography>
            {isLoading && <LoadingSpinner fixed={false} />}
            {data && (
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart
                        width={600}
                        height={300}
                        data={data.data}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                    >
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#8884d8"
                        />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </>
    );
};

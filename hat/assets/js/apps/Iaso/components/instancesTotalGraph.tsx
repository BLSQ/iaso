import React, { FunctionComponent } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Typography } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';

type Data = {
    index: number;
    period: string;
    value: number;
    total: number;
    name: string;
}[];

type Field = {
    name: string;
    type: string;
    tz?: string;
};

type Schema = {
    fields: Field[];
    pandas_version: string;
    primaryKey: string[];
};

type Props = {
    data: {
        data: Data;
        schema: Schema;
    };
    isLoading: boolean;
};

export const InstancesTotalGraph: FunctionComponent<Props> = ({
    data,
    isLoading,
}) => {
    return (
        <>
            <Typography variant="h5">
                <FormattedMessage
                    id="iaso.form.stats.allSubmissionsTitle"
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
